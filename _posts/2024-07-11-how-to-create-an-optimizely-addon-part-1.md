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

## JavaScript and Stylesheets In Secure Systems

When you first build your UI, it can be very tempting to use third party JS and CSS libraries within your AddOn.  In the first iterations of Stott Robots Handler I was referencing JQuery and Bootstrap straight from their CDN providers and then the script to make the page work was contained in an inline script tag.  This may sound like an acceptable approach for a simple UI, but actually this can cause a lot of pain for those who are security minded.

The result of any penetration test will highlight the lack of a Content Security Policy (CSP) as a high risk issue. The CSP is an Allowlist of third party domains and what permissions they have to operate on your website.  If a CSP covers both the visitable UI and the CMS Editor experience, then it must include the origins of your third party scripts.  Lets say you reference a library on jsdelivr, then the CSP for entire site then needs to permit jsdelivr because of one single page.

Instead build and compile your JS and CSS as bundles and package them in your Razor Class Library under the wwwroot folder or install them into the protected modules folder of the consuming website.  Your dependencies will be more optimized and the consuming website will also benefit from being able to use a much more secure Content Security Policy.  If you are going to use an inline script or style tag, make sure you consume Optimizely's `ICspNonceService` and use this to populate the `nonce` attribute of any script or style element within your UI.  

_Please note that at the time of writing, Optimizely does not support the `nonce` attribute for it's Editor or Admin interface, but there is an intention to correct this.  Please do not be the developer that stops this from being adopted further down the line._

## Extending The Menu

If your AddOn has it's own interface, then you will want to expose that interface to your users by creating a class that inherits `IMenuProvider` that is also decorated with `[MenuProvider]` attribute.  Optimizely will automatically identify these classes and use them to extend the menu.

In the following example, I am returning a single `UrlMenuItem` which takes three parameters: the name of the link within the menu, the path within the menu and the MVC controller route for where my interface exists.  I am then extending this to say that it is always available and sorting this to the end of the list of menu items.  I am also defining the authorization policy required to access this menu item.

```
[MenuProvider]
public sealed class ExampleMenuProvider : IMenuProvider
{
    public IEnumerable<MenuItem> GetMenuItems()
    {
        return new UrlMenuItem(
          "My AddOn",
          "/global/cms/my.addon",
          "/my-addon-controller-route/")
        {
            IsAvailable = context => true,
            SortIndex = SortIndex.Last + 1,
            AuthorizationPolicy = "required.security.policy"
        };
    }
}
```

If you start the menu path with `global` then your AddOn will become visible within the module selector.  If you start it with `global/cms`, then your AddOn will become visible under AddOns in the left hand menu of the CMS.

![Left Hand Menu in Optimizely CMS](/assets/creating-addons-simple-menu.png)

If you have multiple menu items that you want to present in a hierarchial fashion, then you can simply return multiple UrlMenuItems, making sure to define the paths for the child menu items under their parent. 

```
[MenuProvider]
public class ExampleMenuProvider : IMenuProvider
{
    public IEnumerable<MenuItem> GetMenuItems()
    {
        yield return new UrlMenuItem(
          "My Addon Parent",
          "/global/cms/myaddon.menu.example",
          "/my-addon-controller-route/parent/")
        {
            IsAvailable = context => true,
            SortIndex = SortIndex.Last + 1,
            AuthorizationPolicy = "required.security.policy"
        };

        yield return new UrlMenuItem(
          "My Addon Child One",
          "/global/cms/myaddon.menu.example/child.one",
          "/my-addon-controller-route/child-one/")
        {
            IsAvailable = context => true,
            SortIndex = SortIndex.Last + 1,
            AuthorizationPolicy = "required.security.policy"
        };

        yield return new UrlMenuItem(
          "My Addon Child Two",
          "/global/cms/myaddon.menu.example/child.two",
          "/my-addon-controller-route/child-two/")
        {
            IsAvailable = context => true,
            SortIndex = SortIndex.Last + 2,
            AuthorizationPolicy = "required.security.policy"
        };
    }
}
```

Parent and child menu items will manifest as it's own menu when it opens and this adopts the same style as the administrator interface. Please note that this consumes an additional 120 pixels of horizonal real estate and you may want to override the styles on your pages.  If your interface is built as a single page application, then you can set the child menus to have the same URL as the parent but with anchor tags and toggle UI visibility based on this.

![Left Hand Menu in Optimizely CMS](/assets/creating-addons-parent-child-menu.png)

Notes:

- Handling Issues with wwwroot being omitted
- Authentication
