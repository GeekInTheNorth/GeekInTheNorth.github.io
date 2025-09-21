---
layout: post
title: "Opal Tools Support Comes to Stott Robots Handler v6"
description: "Stott Robots Handler for Optimizely CMS 12 has been released with added support for Opal Tools."
permalink: "/article/stott-robots-handler-v6"
category:
  - Development
  - Optimizely
  - "Stott Robots Handler"
relatedArticles:
  - "_posts/2025-09-19-helping-opal-build-llms.txt-content.md"
---

During August, the Netcel team and I took part in the Optimizely Opal Hackathon.  The challenge for this hackathon was to generate tools that extend Opal's abilities within the Optimizely Platform.  As a late second entry for our team, I put forward a proposal to add Opal Tools support to an Optimizely AddOn.  This work sparked something bigger, and today I'm excited to share that Opal Tools functionality and improved headless support has made it's way into a production-ready release of Stott Robots Handler v6.

This update makes it easy to manage your robots.txt and llms.txt content through Opal with secure token management.

## Managing Bearer Tokens

Optimizely's Opal uses **bearer tokens** for managing secure access to the tools.  In version 6, A new tab has been added to the robots interface that allows the user to create and manage their bearer tokens.  This screen not only provides supporting details around the available endpoints, but also lets you create multiple tokens, each with it's own permissions for the **robots.txt** and **llms.txt** content.

![A screenshot of the API Token management screen](/assets/robots-handler-opal-tools-1.png)

Creating a token only takes a few clicks:

1. Click **Add Token**.
2. Give your token a name.
3. Generate it's value.
4. Choose permission scopes for **robots.txt** and **llms.txt**.

It is important to remember that token values are only shown once.  Do remember to take a copy of your token value before saving, because once it dissappears, you won't see it again.

![A screenshot of the create new token modal](/assets/robots-handler-opal-tools-2.png)

The available scopes are:

- **None**: This grants no access to any endpoint.
- **Read**: This grants access to the **Get** endpoint only.
- **Write**: this grants access to both the **Get** and **Save** endpoints.

## Registering The Tools in Opal

Adding the tools into Opal is a straightforward registration process.

1. Open the Optimizely Opal interface.
2. Click Tools (bottom of the left-hand menu).
3. From the tools screen, click Add Tool Registry.

![A screenshot of the Opal Tools interface in Optimizely Opal](/assets/robots-handler-opal-tools-3.png)

You will see a short form:

- **Registry Name**: Any value works; I recommend "Robots Handler Tools"
- **Discovery URL**: On the Robots Handler token screen, use the **Copy URL** button next to the **Discovery API** and paste it here.
- **Bearer Token**: Paste the token you generated earlier.

![A screenshot of the Add Tool Registry form](/assets/robots-handler-opal-tools-4.png)

## Using The Tools

Once registered, you can start using the Robots Handler tools immediately in Opal’s chat interface. Just ask questions or give instructions, such as:

- "Get me a list of robots.txt configurations."
- "Show me the robots.txt for mydomain.com."
- "Add a sitemap.xml to the robots.txt for mydomain.com."

![A screenshot of the conversations with Opal regarding robots.txt content](/assets/robots-handler-opal-tools-5.png)

It is best practice to be as verbose as possible when getting Opal to make changes to your robots.txt or llms.txt content.  Ask Opal to show you the changes first, review them and iterate before applying your changes. 

![A screenshot of a more verbose conversations with Opal regarding robots.txt content](/assets/robots-handler-opal-tools-6.png)

One thing to note: the discovery endpoint itself doesn’t send a token. This means Opal sees all tools as potentially available, but actual access depends on the permissions you granted. If a tool requires more permissions than your token allows, Opal will receive a “not authorised” response.

## Getting Started

Stott Robots Handler v6 is available for **Optimizely PAAS CMS 12** on both nuget.optimizely.com and on nuget.org.  You can see the full installation instructions and package information over on the [github page](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler), including how to configure the addon for use with Opti Id.

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

With Opal Tools support now built into Robots Handler, managing your search visibility and AI indexing just got a lot more powerful and easier.  Try it out today, and let me know how you use it in your projects.