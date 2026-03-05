---
layout: post
title: "Using Caching and Async to Improve Performance"
description: "A deep dive into improving the performance of features using Optimizely Search & Navigation by implementing async and caching."
permalink: "/article/using-caching-and-async-to-improve-performance"
category:
  - Development
  - Optimizely
---

There are three main uses of dynamic content resolution that we commonly see in CMS websites:

- Listing Pages: Offering targeted filtering and discoverability of content such as Case Studies, News & insights.
- Site Search: Offering global general search of content pages and documents.
- Related Content Block: Offering filtered content matching the AI of the current document.

With Optimizely, these have typically been delivered using Search & Navigation and now more recently with Content Graph.  Some solutions include indexes that are not part of the Optimizely ecosystem such as Algolia and Azure AI Search.

In the following sections I'm going to be talking about improving performance with a case study that includes Optimizely CMS 12 and Search & Navigation.  The lessons can be easily translated to other indexes and uses.  In this particular case study, the site in question received 450,000 requests a day and was encountering issues with Thread Pool Starvation being reported every week and an average request response time of 1.52s.  Following these changes, the average request response time dropped to 0.044s ... a 98% reduction in request response time.

## Asynchronous Requests



<a href="https://world.optimizely.com/blogs/manh-nguyen/dates/2024/7/asynchronous-search-with-optimizely/" target="_blank">Non-blocking Search with Optimizely Search & Navigation</a>