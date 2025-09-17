---
layout: post
title: "404 Error on Static Assets Within an Optimizely Plugin"
description: "Resolving 404 issues on static files in razor class libraries using the _content/foo.bar/scripts.js path."
permalink: "/article/404_error_on_static_assets_within_an_optimizely_plugin/"
category:
  - Development
  - Optimizely
---

# 404 Error on Static Assets Within an Optimizely Plugin

<i class="fa-solid fa-calendar me-2"></i>Published: 22nd September 2022

## Background

With the move to CMS 12 and .NET 5/6/7, developers are now able to build Plugins and Extensions using Razor Class Libraries (RCL).  These are a fantastic option as it allows you to bundle up any client side scripts, styles and razor files into the same compiled dll as your buisness logic.  The structure of the Razor files and static files within an RCL is the same structure as what you would expect to see within a Web project.

The biggest benefit is that it makes it very clean to install and remove said plugin as it does not require any zip files to be deployed into a modules folder and really compartmentalizes your plugin.  To date I have built two different plugins which utilize Razor Class Libraries:

- [Stott.Optimizely.RobotsHandler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) currently at v2.6.1 (v2.1.0 at the time of writing)
- [Stott.Security.Optimizely](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) currently at v1.2.1 (v0.4.0 at the time of writing)

## The Problem

I was contacted by Praveen Soni on the Optimizely Community slack about an issue they were encountering.  In development the Stott.Optimizely.RobotsHandler module was working as anticipated, however when it deployed into DXP they were receiving a 404 error on the following file: 

```
https://example.dxcloud.episerver.net/_content/Stott.Optimizely.RobotsHandler/RobotsAdmin.js
```

Praveen and I chatted some more, we talked about the requirements within the startup.cs file, I got them to share their error logs in hopes of trying to understand why this javascript file from the Razor Class Library was not being served.

I later stumbled upon this article that resonated with the issue that we were encountering: [How to deal with the "HTTP 404 '_content/Foo/Bar.css' not found" when using Razor component package on ASP.NET Core Blazor app](https://dev.to/j_sakamoto/how-to-deal-with-the-http-404-content-foo-bar-css-not-found-when-using-razor-component-package-on-asp-net-core-blazor-app-aai) and this led me back to this article on the microsoft website [Create reusable UI using the Razor class library project in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-6.0&amp;amp;tabs=visual-studio) 

## The Solution

If your Razor Class library includes Razor Pages, then the following methods need to called with the the Startup.cs of the consuming application:

```
services.AddRazorPages();

app.MapRazorPages();
```

If your Razor Class library includes static files like .css and .js files, then a call to UseStaticWebAssetts() must be used in the Program.cs of the consuming application:

```
public static class Program
{
   public static void Main(string[] args) => CreateHostBuilder(args).Build().Run();
   public static IHostBuilder CreateHostBuilder(string[] args) =>
       Host.CreateDefaultBuilder(args)
           .ConfigureCmsDefaults()
           .ConfigureWebHostDefaults(webBuilder =>
           {
               webBuilder.UseStartup<Startup>();
               webBuilder.UseStaticWebAssets();
           });
}
```

Now here is the fun part: if the **ASPNETCORE_ENVIRONMENT** environment variable is set to Development, then .NET automatically includes a call to **UseStaticWebAssets()**, if it is set to any other value, then you have to manually add this to your code!  It is this final part of the puzzle which explains why the code worked perfectly in some environments but failed in others.