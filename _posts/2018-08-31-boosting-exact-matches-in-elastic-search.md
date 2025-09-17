---
layout: post
title: "Boosting Exact Matches in Elastic Search"
description: "A solution for boosting exact matches over partial matches in Elastic Search."
permalink: "/article/boosting_exact_matches_in_elastic_search"
category:
  - Development
---

## The Problem

A client had a site built using Optimizely CMS 11 which featured a search page utilizing ElasticSearch.Net. They had a new requirement for the search page to return partial matches in the search results.  For example, if the user were to search for the word "car", they would also get results for "career".

In testing, articles about careers had a higher relevance than articles about cars.  The customer then added a new requirement for articles with exact word matches to be appear further up the results list.

## The Solution

In order to only boost exact matches, the elastic query had to be split into two separate query descriptors. One for exact matches with boosting applied and a second for partial matches with no boosting. The SearchDescriptor was then built to return results that fell into either query descriptor.

```
var titleBoost = 10;
var descriptionBoost = 5;

var exactMatches = new MultiMatchQueryDescriptor<IndexableContent>()
    .Fields(f => f
        .Field(mf => mf.Title, titleBoost)
        .Field(mf => mf.Description, descriptionBoost))
    .Operator(Operator.Or)
    .Type(TextQueryType.Phrase)
    .Query(searchText);

var partialMatches = new MultiMatchQueryDescriptor<IndexableContent>()
    .Fields(f => f
        .Field(mf => mf.Title)
        .Field(mf => mf.Description))
    .Operator(Operator.Or)
    .Type(TextQueryType.PhrasePrefix)
    .Query(searchText);

var searchDescriptor = new SearchDescriptor<IndexableContent>();
searchDescriptor.Index(indexName)
                .Type(types)
                .From(fromResult)
                .Size(noResults)
                .Query(q => q.MultiMatch(m => exactMatches) || q.MultiMatch(m => partialMatches));
```
