---
layout: post
title: "A Robots.Txt Handler for Optimizely CMS 12"
description: "A new robots.txt handler that has been built for use with Optimizely CMS 12."
permalink: "/article/a_robots_txt_handler_for_optimizely_cms_12"
category:
  - Development
  - Optimizely
---

# A Robots.Txt Handler for Optimizely CMS 12

## Stott.Optimizely.RobotsHandler v1.0.1 Released

[Stott.Optimizely.RobotsHandler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) is a new robots.txt handler for Optimizely CMS 12 that fully supports multi-site builds with potentially different robots.txt content to be delivered by site. This package is inspired by work previously delivered with [POSSIBLE.RobotsTxtHandler](https://github.com/made-to-engage/MadeToEngage.RobotsTxtHandler) which was built for CMS 11.  [Stott.Optimizely.RobotsHandler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) has been built from the ground up initially as a learning exercise building on lessons learned in my previous post: [Extending The Admin Interface in Optimizely CMS 12](/article/custom_admin_pages_in_optimizely_12).

## The Interface

The interface is built using a standard .NET 5.0 MVC Controller with a Razor view with a small supporting JS file that is compiled as a Razor Class Library.  The benefit of building this as a Razor Class Library is that Nuget only needs to provide the DLL keeping your solution otherwise clean of any artefacts from the package. 

The UI is a single page using Bootstrap 5.0 and JQuery that renders a complete list of all sites configured within the CMS instance.

![Stott Robots Handler - Listing View](/assets/robots-handler-1.png)

The content of the robots.txt for any site is shown in a modal dialog and saved via an API call that stores the robots.txt content into the Dynamic Data Store.  Custom tables have not been used as the expection is that there will be a 1-to-1 relationship between sites and their robots.txt content.

![Stott Robots Handler - Edit Modal](/assets/robots-handler-2.png)

## Installation & Configuration

Installation is straight forward, the Stott.Optimizely.RobotsHandler package can be installed either from the Optimizely nuget feed or from the nuget.org feed.  You will then need to add the following lines to the Startup class in your .NET 5.0 solution:

```
public void ConfigureServices(IServiceCollection services)
{
   services.AddRazorPages();
   services.AddRobotsHandler();
}
```

The call to services.AddRazorPages() is a standard .NET 5.0 call to ensure razor pages are included in your solution.

The call to services.AddRobotsHandler() sets up the dependency injection requirements for the RobotsHandler solution and is required to ensure the solution works as intended. This works by following the Services Extensions pattern defined by microsoft.

## Resolving robots.txt content

A standard controller is configured to respond to requests to `www.example.com/robots.txt`. When recieving the request, the controller interogates the domain of the request and uses this to resolve the relevant site and the returns the robots.txt content for that site.  If not content has been previously defined for the site, the the default content will be returned as follows:

```
User-agent: *
Disallow: /episerver/
Disallow: /utils/
```

# Contributing and Licencing

Stott.Optimizely.RobotsHandler has been built and uses the MIT licence.  If you find any defects with the package, then please log them as issues on the the repositories [issues](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler/issues) page. If you would like to contribute to changes for the solution, then feel free to clone the repository and submit a pull request against the develop branch.