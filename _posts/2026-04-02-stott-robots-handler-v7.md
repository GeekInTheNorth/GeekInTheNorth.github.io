---
layout: post
title: "Opal Tools Support Comes to Stott Robots Handler v7"
description: "Stott Robots Handler v7 for Optimizely CMS 13 has been released with added support for Opal Tools."
permalink: "/article/stott-robots-handler-v7"
category:
  - Development
  - Optimizely
  - "Stott Robots Handler"
relatedArticles:
  - "_posts/2025-08-08-stott-robots-handler-v5.md"
  - "_posts/2025-09-17-stott-robots-handler-v6.md"
  - "_posts/2026-01-30-working-with-applications-in-cms13.md"
---

Stott Robots Handler version 7 is now available for **Optimizely PaaS CMS 13**.  This is includes updates to support the switch from a Site based architecture to an Application based architecture.

![Robots Handler V7 initial interace](/assets/robots-handler-v7.png)

## How does the change from Sites to Applications impact the user?

The data structure of Applications is subtly different to that of Sites.  In CMS 12, sites were uniquely identified using a GUID.  In CMS 13, Applications are uniquely identified using a string identifier. This breaks the relationship between existing robots.txt and llms.txt content and the sites they were configured to serve.

Users will have to reconfigure their robots.txt and llms.txt content when moving from CMS 12 to CMS 13.  The content for both files is stored in the Dynamic Data Store and is matched to an active application before being displayed to the CMS Administrator or being served to end users.

The Environment Robots and the API Tokens are global configurations and are not bound to a specific site or application.  When upgrading to version 7 and CMS 13, these features will retain their existing configuration.

### What features does Stott Robots Handler have?

- 🤖 Manage robots.txt content by Application and specific Host URL
- 📄 Manage llms.txt content by Application and specific Host URL
- 🔒 Override robots meta tags and response headers at an environment level to prevent indexing lower environments in search engines.
- 🌐 APIs to support headless solutions
- 🌐 APIs to support modification of robots.txt and llms.txt content directly within Optimizely Opal

## What does this mean for Optimizely CMS 12?

Support for version 6 of the Stott Robots Handler is not going away.  New functionality will be developed directly for version 7 and then backported to version 6 where appropriate. I can review the recent download stats on a version by version basis on nuget and I will use this as an indicator of the current market need.

I expect that it will take a few years for a significant portion of customers to move from CMS 12 to CMS 13.  Therefore, I expect to maintain the CMS 12 version for the short to mid term.

## Getting Started

Stott Robots Handler v7 is available for **Optimizely PaaS CMS 13** on nuget.org.  You can see the full installation instructions and package information over on the [github page](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler), including how to configure the add-on for use with Opti Id.

Getting started can be as simple as: 

```c#
// Install the nuget package
dotnet add package Stott.Optimizely.RobotsHandler

// Add this to your services
services.AddRobotsHandler();

// Add this to your configure method
services.UseRobotsHandler();

// Add this to your _ViewImports.cshtml if you are running traditional
@addTagHelper *, Stott.Optimizely.RobotsHandler
```
