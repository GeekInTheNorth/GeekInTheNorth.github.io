---
layout: post
title: "Using Caching and Async to Improve Performance"
description: "A deep dive into improving the performance of features using Optimizely Search & Navigation by implementing async and caching."
permalink: "/article/using-caching-and-async-to-improve-performance"
category:
  - Development
  - Optimizely
---

Almost every CMS served website has some concept of dynamic content resolution.  A means to serve up related or latest content links while minimising the burden on the content editors. This style of functionality is commonly delivered through functionality such as Search & Navigation, Content Graph, Algolia or some other indexing functionality.  Another common use of dynamic content resolution are mega menus where the structure is based on the IA of the site and uses some form of recursive logic.  For an **In-Process** or **Traditional CMS**, these can have a significant impact on the server response time for a page.  The server response time is the time between the server receiving a request and delivering it's response, disregarding any transmission time between the server and the client.

In the following sections I'm going to be talking about improving performance with a case study that includes Optimizely CMS 12 and Search & Navigation.  The lessons can be easily translated to other indexes and uses.  In this particular case study, the site in question received 450,000 requests a day and was encountering issues with Thread Pool Starvation being reported every week and an average server response time of 1.52s.  Following these changes, the average server response time dropped to 0.044s, a 98% reduction!

## What is Thread Pool Starvation?

Think of your application like a restaurant with a fixed number of chefs.  Each chef (thread) can handle one order (request) at a time. Most of the time, orders are completed quickly and everything flows. But sometimes a chef needs extra ingredients, so they stop and wait.

Now imagine multiple chefs all waiting at the same time. They're not cooking, but they're also not free to take new orders. If enough chefs are waiting, no new meals get made. Orders pile up. The kitchen slows to a crawl.

That's Thread Pool Starvation.  In a .NET application, threads handle incoming requests. When those threads are blocked, typically waiting on I/O like database calls or search queries, they can’t be reused. Under load, this leads to:

- Requests queuing up
- Slower response times
- An unresponsive application

Importantly, this isn't a resource problem. CPU and memory might be fine, but your threads are tied up doing nothing.  This is why synchronous calls are dangerous at scale. Each one blocks a thread until it completes. Asynchronous code avoids this by freeing the thread while waiting. Instead of standing idle, the "chef" moves on to the next order, keeping the system responsive and throughput high.

## How does asynchronous code improve performance?

The number one culprit in Thread Pool Starvation was the use of the legacy synchronous methods for Search & Navigation.  The asynchronous replacement for GetContentResult was introduced in EPiServer.Find 16.3.0 as GetContentResultAsync.

In my case, I had a listing block that used Optimizely Search & Navigation to return the 4 most recent news articles. On the surface, this seems like a lightweight query, but under load, even small synchronous calls add up quickly and contribute to thread pool starvation.  The obvious first step was to switch from **GetContentResult** to **GetContentResultAsync**. However, simply calling the async method isn’t enough to realise the benefits. If you block on it further up the call stack (for example with .Result or .GetAwaiter().GetResult()), you're back to the same problem, tying up threads while waiting.

To make this change effective, the async pattern needs to flow all the way back to the rendering layer. In Optimizely CMS, that meant pushing the change up to the ViewComponent level.

Instead of using:
```C#
public class ListingBlockComponent : BlockComponent<ListingBlock>
{
    protected override IViewComponentResult InvokeComponent(ListingBlock currentContent)
    {
        var results = await _searchClient
            .Search<ArticlePage>()
            .OrderByDescending(x => x.StartPublish)
            .Take(4)
            .GetContentResult();

        return View(results);
    }
}
```

The component was refactored to:
```C#
public class ListingBlockComponent : AsyncBlockComponent<ListingBlock>
{
    protected override async Task<IViewComponentResult> InvokeComponentAsync(ListingBlock currentContent)
    {
        var results = await _searchClient
            .Search<ArticlePage>()
            .OrderByDescending(x => x.StartPublish)
            .Take(4)
            .GetContentResultAsync();

        return View(results);
    }
}
```

There are two key changes here:

- Inheriting from AsyncBlockComponent&lt;T&gt; instead of BlockComponent&lt;T&gt;
- Switching to InvokeComponentAsync and fully embracing async/await

This allows the thread handling the request to be released while waiting for the search query to complete. Once the results are ready, execution resumes and the response is rendered.

The important point is that async isn't just about swapping one method for another, it's about ensuring the entire execution path is non-blocking. By pushing async all the way up to the ViewComponent, the application can handle significantly more concurrent requests without exhausting the thread pool.

## How does adding caching improve performance?

Once asynchronous code removes unnecessary thread blocking, the next step is reducing how often you need to do the work in the first place.  That's where caching comes in.

In the case of a listing block, building the model can involve multiple operations, querying an index, resolving content references, applying enrichment such as category information, and shaping the final view model. Even when each individual operation is relatively fast, the combined cost adds up quickly under load. By caching the final model, you avoid repeating all of that work on every request.

This has two key benefits:

- Fewer operations per request: instead of multiple lookups and transformations, you perform one fast cache read
- Reduced dependency on the index: avoiding repeated calls to the index removes round trips and frees it up for unique queries

At scale, this dramatically reduces both response times and system load.

```C#
public class ListingBlockComponent(
  ISynchronizedObjectInstanceCache cache,
  IPageRouteHelper pageRouteHelper) : AsyncBlockComponent<ListingBlock>
{
    protected override async Task<IViewComponentResult> InvokeComponentAsync(ListingBlock currentContent)
    {
        var cacheKey = GetCacheKey(currentContent);
        if (!cache.TryGet<ListingBlockModel>(cacheKey, ReadStrategy.Immediate, out model))
        {
            model = BuildModel(currentContent);

            // The use of a master key here allows us to remove all our custom caches based on a constant known value.
            var evictionPolicy = new CacheEvictionPolicy(
              AppConstants.CacheDuration,
              CacheTimeoutType.Absolute, 
              [], [AppConstants.MasterKey]);
            cache.Insert(cacheKey, model, evictionPolicy)
        }

        return View(results);
    }

    private async ListingBlockModel BuildModel(ListingBlock currentContent)
    {
        // Model building logic (e.g. async Search & Navigation call)
    }

    private string GetCacheKey(ListingBlock currentContent)
    {
        var contentId = pageRouteHelper.ContentLink?.ID ?? 0;
        var language = pageRouteHelper.LanguageID;
        var blockId = (currentContent as IContent)?.ContentLink?.ID ?? contentId;

        // Create a new cache key unique to the block, page and language
        // e.g. MB:123:456:EN
        return $"MB:{contentId}:{blockId}:{language}";
    }
}
```

> 💡**Top Tip**: Short cache key names can result in faster cache lookups, but make sure you maintain the right level of uniqueness for your own usage.

## Why Asynchronous Code and Caching work well together

This approach is effective because it combines both strategies:

- Async ensures threads aren’t blocked while building the model
- Caching ensures the model rarely needs to be rebuilt at all

The result is a dramatic reduction in both thread usage and external calls, exactly what you need to avoid thread pool starvation and improve response times under load.

In my case study, caching wasn't just applied in one place, it was introduced across several high-impact components that were rebuilt on every request.  These included:

- A mega menu driven by content hierarchy.
- Listing Blocks (as described above)

The mega menu was the biggest offender. Each request triggered a large number of content lookups as the hierarchy was recursively resolved using IContent Loader. By caching the final menu model, those lookups were eliminated—reducing the number of operations by 500+ per request.

For listing blocks, caching removed repeated calls to the index and avoided rebuilding the model entirely. This ensured that common queries like "latest articles" were served instantly without hitting the index.

Across the solution this resulted in

- Fewer content lookups
- Fewer external calls
- Less work per request

And ultimately, far less pressure on the thread pool.

![promo 1](/assets/async-and-caching-performance-promo.png)
![promo 2](/assets/async-and-caching-performance-promo-2.png)