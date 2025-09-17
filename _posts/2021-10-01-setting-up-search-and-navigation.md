---
layout: post
title: "Setting Up Search & Navigation in .NET 5.0"
description: "A brief guide to setting up Optimizely Search and Navigation in the .NET 5.0 world."
permalink: "/article/setting-up-search--navigation-in--net-5-0"
category:
  - Optimizely
  - Development
---

# Setting Up Search & Navigation in .NET 5.0

<i class="fa-solid fa-calendar me-2"></i>Published: 1st October 2021

UPDATE: The documentation has now been updated and can be found here: https://world.optimizely.com/documentation/developer-guides/search-navigation/getting-started/creating-your-project/

Optimizely CMS for .NET 5.0 is a very exciting thing.  Recently the .NET Core Preview documentation was archived and some of that documentation was merged into the live developer guides. Optimizely have a huge amount of developer documentation and it's going to take a while for this content to be updated for .NET 5.0.  Sadly the current documentation for Optimizely Search and Navigation is still focused on the .NET 4.x world.

1. Add the EPiServer.Find.CMS NuGet package to your .NET 5.0 solution.
2. Generate a new Search and Navigation index at https://find.episerver.com/
3. Configure the index details in appsettings.json

When you create the index, you will be shown this snippet to add to your web.config:

```
<configuration>
    <configSections>
        <section
            name="episerver.find" type="EPiServer.Find.Configuration, EPiServer.Find" requirePermission="false"/>
    </configSections>
    <episerver.find
        serviceUrl="https://demo01.find.episerver.net/RXQGZ5QpXU9cuRSN2181hqA77ZFrUq2e/"
        defaultIndex="yourname_indexname"/>
</configuration>
```

You will instead add this to appsettings.json like so:

```
{
    "EPiServer": {
        "Find": {
            "ServiceUrl": "https://demo01.find.episerver.net/RXQGZ5QpXU9cuRSN2181hqA77ZFrUq2e/",
            "DefaultIndex": "yourname_indexname"
        } 
    } 
}
```

4. Configure your startup.cs to include the find configuration:

```
public void ConfigureServices(IServiceCollection services)
{
    services.AddCmsAspNetIdentity<ApplicationUser>();
    services.AddMvc();
    services.AddCms();
    services.AddFind();
 }
```

You should now have everything you need to write your search queries as normal:

```
var searchResult = _findClient.Search<SitePageData>()
                              .For(request.SearchText)
                              .UsingSynonyms()
                              .ApplyBestBets()
                              .Skip(skip)
                              .Take(pageSize)
                              .GetContentResult();
```
