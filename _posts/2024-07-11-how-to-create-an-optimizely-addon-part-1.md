---
layout: post
title: "Creating an Optimizely Addon - Adding a Custom Admin Page"
description: "How to create an Addon with it's own UI within Optimizely CMS PAAS Core."
permalink: "/article/creating-an-optimizely-addon-part-1"
category:
  - Development
  - Optimizely
---

# Creating an Optimizely Addon - Getting Started with a Custom Admin Page

Published: 11th July 2024

When Optimizely CMS 12 was launched in the summer of 2021, I created my first Addon for Optimizely CMS and talked about some of the lessons I learned in my article [Custom Admin Pages in Optimizely 12](/article/custom_admin_pages_in_optimizely_12). Three years on, I have two highly refined Optimizely Addons and have had to resolve numerous challenges.  In this new series of articles I will be covering a number of the solutions as well as what I consider to be best practices.

## Having a Great Idea

The biggest hurdle to getting started with creating an addon is having a good idea.  But here is the secret to having a great idea; it doesn't have to be great and it doesn't have to be original.  My first addon was a very simple UI for managing robots.txt content within CMS 12 and I already knew a package existed for CMS 11 that had not been updated for a number of years.  I've now met Mark Everard (the original addon author) a number of times and my addon has had nearly 200k downloads.

Your addon does not need to be pretty, your end user is a CMS editor or administrator, it needs to be easy to understand and it needs to be functional.

Finally, whatever idea you come up with, you need to be passionate about it as it will consume a lot of your time.  I average roughly a commit per hour, based on this I have spent 140 hours on Stott Robots Handler and 577 hours on Stott Security.  When converted to an average working day, that is 19 and 77 days respectively.  You may also never make a single penny, there are many great addons out there that are open source, running on an MIT license without a license fee.

## Solution Structure

Addons for Optimizely CMS come in the form of a NuGet package that is installed directly into the website. When we create our AddOn, we need to look at the number of projects within the AddOn that the consuming application will need to reference.  Each project the consuming application has to reference will become it's own NuGet package.  The more packages you need to create, the greater the administrative burden is for yourself and for Optimizely.  Likewise, the more packages you need to create, the more potential pain you could cause your end users in managing upgrades, especially if each package has different dependencies.

My recommendation is to constrain your Addon to a single project that is a [Razor Class Library (RCL)](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-8.0&tabs=visual-studio).  An RCL will allow you to package up all of your classes, razor files and wwwroot content into one neat compiled package.  The consuming Website will then be able to serve your controllers with the razor files and static assets you have packaged up within your project.  An interesting aspect of Razor Class Libraries is that the consuming website can override your razor files by providing it's own razor file on the same path within the Views folder.  The benefit of this is that the consumer has the opportunity to modify the UI, perhaps they want to change the title or offer additional guidance within the UI.  The downside is that you need to carefully consider your Razor file paths and names so as to avoid accidental collisions within consuming applications.

When you create an Addon, you do need to accept that you will be releasing multiple versions, and in some cases that release could be a hotfix that needs a rapid turn around.  You can help yourself greatly by adding a unit test project to your solution and adding tests for all key journeys.  This will provide you with additional confidence when deploying future releases and it will help you recognise and fix bugs before they reach the end user.  As the only developer on two addons, the level of unit test coverage within my addons drastically reduces the amount of manual testing I need to perform for every release.

Section Summary:
- Do try to keep your AddOn production code to a single project.
- Do use a Razor Class Library to package all of your UI into a single compiled project.
- Do use very specific razor file paths and names to prevent collisions with razor file paths in the consuming application.
- Do create a suite of unit tests for your code.


Notes:

- Razor Class Libraries
- Why you should compile and ship JS & CSS
- Handling Issues with wwwroot being omitted
- Menu Providers
- Authentication
- Nuget Parameters
- Submitting a module