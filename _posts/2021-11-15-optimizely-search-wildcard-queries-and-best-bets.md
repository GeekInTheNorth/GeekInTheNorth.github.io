---
layout: post
title: "Optimizely Search Wildcard Queries and Best Bets"
description: "Implementing Wild Card search in Optimizely CMS 11 Search and Navigation."
permalink: "/article/optimizely_search_wildcard_queries_and_best_bets"
category:
  - Development
  - Optimizely
---

In a recent client build, I have been tasked with updating their search to use wild card searches.  I had read a number of posts pointing to the same solution as detailed by Joel Abrahamsson's 2012 blog post, [Wildcard Queries with Episerver Find](http://joelabrahamsson.com/wildcard-queries-with-episerver-find/) and Drew Null's post [Episerver Find Wildcard Queries and Best Bets](https://world.optimizely.com/blogs/drew-null/dates/2018/4/find-wildcardquery-and-best-bets---a-workaround/). These solutions included building an extension method that built a bool query wrapping a wild card query. This included complications in how to get best bets to work with wildcards.

While the solution did work, after reviewing the performance of the query and the structure of the query being sent to Optimizely Search and Navigation, I discovered that the solution was actually much simpler and did not need any new scaffolding of custom query building.  The For method has overloads which exposes the QueryStringQuery object that allows you to customise the query behaviour.

```
private ITypeSearch<T> GetQuerySearch<T>(
   string query,
   bool isWildCardSearch) where T : MyVariant
{
   var specificQuery = isWildCardSearch ? $"*{query}*" : query;
   return _findClient.Search<T>()
   .For(query, options =>
          {
               options.Query = specificQuery;
                options.AllowLeadingWildcard = isWildCardSearch;
                options.AnalyzeWildcard = isWildCardSearch;
                options.RawQuery = query;
          })
   .InField(f => f.FieldOne, _settings.FieldOneBoost)
   .InField(f => f.FieldTwo, _settings.FieldTwoBoost)
    .InField(f => f.FieldThree, _settings.FieldThreeBoost)
    .InField(f => f.FieldFour)
    .InField(f => f.FieldFive)
    .InField(f => f.FieldSix)
    .InField(f => f.FieldSeven)
    .InField(f => f.FieldEight)
    .UsingSynonyms()
    .UsingAutoBoost(TimeSpan.FromDays(_settings.AutoBoostTimeSpanDays))
    .ApplyBestBets()
    .FilterForVisitor();
}
```

By passing in the wild card version of the query string into options.Query and setting options.AllowLeadingWildcard and options.AnalyzeWildcard to true was all I needed for wildcard search to be functional.  I also passed in the unaltered query into options.RawQuery but this was not required in order to make Best Bets work.

The main downside to this approach is that synonym functionality no longer worked.  The query with the wildcards would never match a synonym but it would work with best bets.  I resolved this by using a Multi Search query and passed in the unaltered query and then the wild card query.  In Multi Search, each result set is returned in the same order in which it has been defined and they are packaged in a single API call.  It was then a simple case of selecting the first result set with at least one match.

```
var searchResult _findClient.MultiSearch<DentalVariantProjectionModel>()
   .Search<MyVariant, MyProjectionModel>(x => GetQuerySearch(query, false))
   .Search<MyVariant, MyProjectionModel>(x => GetQuerySearch(query, true))
   .GetResult();

var resultToUse = searchResult.FirstOrDefault(x => x.TotalMatching > 0) ?? searchResult.First();
```

Performance wise, the difference in sending two queries in a multi search request was negligable compared to a sending a single query.