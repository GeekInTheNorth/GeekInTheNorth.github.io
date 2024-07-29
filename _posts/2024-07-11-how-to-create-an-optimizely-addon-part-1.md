---
layout: post
title: "Creating an Optimizely AddOn - Adding a Custom Admin Page"
description: "How to create an AddOn with it's own UI within Optimizely CMS PAAS Core."
permalink: "/article/creating-an-optimizely-addon-part-1"
category:
  - Development
  - Optimizely
---

# Creating an Optimizely AddOn - Getting Started with a Custom Admin Page

Published: 11th July 2024

When Optimizely CMS 12 was launched in the summer of 2021, I created my first AddOn for Optimizely CMS and talked about some of the lessons I learned in my article [Custom Admin Pages in Optimizely 12](/article/custom_admin_pages_in_optimizely_12). Three years on, I have two highly refined Optimizely AddOns and have had to resolve numerous challenges.  In this new series of articles I will be covering a number of the solutions as well as what I consider to be best practices.

_Please note that all content within this article has been written by myself, however some elements of the copy have been processed with Chat GPT to improve brevity and to create a more formal tone._

## Having a Great Idea

The biggest hurdle to getting started with creating an AddOn is having a good idea.  But here is the secret to having a great idea; it doesn't have to be great and it doesn't have to be original.  My first AddOn was a very simple UI for managing robots.txt content within CMS 12 and I already knew a package existed for CMS 11 that had not been updated for a number of years.  I've now met Mark Everard (the original AddOn author) a number of times and my AddOn has had nearly 200k downloads.

Your AddOn does not need to be pretty, your end user is a CMS editor or administrator, it needs to be easy to understand and it needs to be functional.

Finally, whatever idea you come up with, you need to be passionate about it as it will consume a lot of your time.  I average roughly a commit per hour, based on this I have spent 140 hours on Stott Robots Handler and 577 hours on Stott Security.  When converted to an average working day, that is 19 and 77 days respectively.  You may also never make a single penny, there are many great AddOns out there that are open source, running on an MIT license without a license fee.

## Solution Structure

When creating an AddOn for Optimizely CMS, it is recommended to package it as a single [Razor Class Library (RCL)](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-8.0&tabs=visual-studio). This simplifies the process by consolidating all classes, controllers, razor files, and static content into one NuGet package. This can reduce administrative tasks and potential upgrade issues for users. There is a one-to-one relationship between projects and NuGet packages; each project you add will require its own NuGet package. An RCL also allows consuming websites to override your Razor files if needed, providing flexibility for UI modifications. However, you must carefully manage file paths to avoid conflicts.

To ensure smooth future releases and quick hotfixes, include a unit test project in your solution. Comprehensive unit tests can significantly reduce the need for manual testing and help identify bugs early. This approach has proven effective, as it has greatly minimized manual testing efforts in my own projects.

## JavaScript and Stylesheets In Secure Systems

When building your UI, it can be tempting to use third-party JS and CSS libraries directly from CDNs. Initially, I did this with JQuery and Bootstrap for Stott Robots Handler, embedding scripts in inline tags. While this might seem convenient, it poses security risks.

Penetration tests will flag the absence of a Content Security Policy (CSP) as a high-risk issue. A CSP is an allowlist of domains and their permissions on your site. If you reference an external library, like one from jsdelivr, the CSP must allow jsdelivr, affecting the entire site.

Instead, compile your JS and CSS into bundles and include them in your Razor Class Library's wwwroot folder or the consuming website's protected modules folder. This approach optimizes dependencies and enhances security by allowing a stricter CSP. If you must use inline scripts or styles, use Optimizely's `ICspNonceService` to add a `nonce` attribute to these elements.

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

## Handling Authentication

If your AddOn UI is intended to be accessible to editors, then you can decorate your controllers with the `[Authorize(Roles = Roles.CmsEditors)]` attribute.  Likewise if you want to make the UI available to CMS Administrators, then you can decorate your controller with `[Authorize(Roles = Roles.CmsAdmins)]`.

Depending on the Domain of your AddOn, you may wish to provide your consumers with the ability to fine tune access to your AddOn. For Stott Robots Handler and Stott Security I wanted to give consumers the ability to grant access to the AddOns to specific users such as an SEO Adminstrator or a Developer without granting that user access to the CMS Administrator interface.  In order to do this, you will want to include the ability to define the authentication policy for your AddOn within your service extension:

```
public static IServiceCollection AddMyAddOn(
    this IServiceCollection services,
    Action<AuthorizationOptions>? authorizationOptions = null)
{
    // Authorization
    if (authorizationOptions != null)
    {
        services.AddAuthorization(authorizationOptions);
    }
    else
    {
        var allowedRoles = new List<string> { "CmsAdmins", "Administrator", "WebAdmins" };
        services.AddAuthorization(authorizationOptions =>
        {
            authorizationOptions.AddPolicy("My.AddOn.Policy.Name", policy =>
            {
                policy.RequireRole(allowedRoles);
            });
        });
    }

    return services;
}
```

If you have made this optional, then the consumer can choose to use your defaults or define the policy themselves within their startup.cs:

```
// Use Default Authentication Policy
services.AddMyAddOn();

// Use Custom Authentication Policy
services.AddMyAddOn(authorizationOptions => 
{
    authorizationOptions.AddPolicy("My.AddOn.Policy.Name", policy =>
    {
        // This line is required if you are using Opti Id
        policy.AddAuthenticationSchemes(OptimizelyIdentityDefaults.SchemeName);

        // This defines the roles required for this policy
        policy.RequireRole("WebAdmins", "SeoAdmins");
    });
});
```

All of your controllers should then instead be decorated with the `[Authorize(Policy = "My.AddOn.Policy.Name")]` attribute and menu items within your `IMenuProvider` should also be created with the same policy name.

## Summary

- Your AddOn does not need to be unique or grand.
- You will need to be passionate about your AddOn.
- Do try to contain your AddOn into a single Razor Class Library to make installs and updates easier.
- Do try to support a stricter Content Security Policy by:
  - Compiling and package your JavaScript and Stylesheets as part of the AddOn.
  - Use `ICspNonceService` to add a `nonce` attribute to your script and style elements.
- Add items into the menu by implementing `IMenuProvider` and decorating it with `[MenuProvider]`
- Do secure all of your controllers to ensure users have to have access to the CMS Interface.
  - Consider using your own Authentication Policy if you want consumers to be able to apply more specific restrictions.
