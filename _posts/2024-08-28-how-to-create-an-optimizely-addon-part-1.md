---
layout: post
title: "Creating an Optimizely AddOn - Getting Started"
description: "How to create an AddOn with it's own UI within Optimizely CMS PAAS Core."
permalink: "/article/creating-an-optimizely-addon-part-1"
category:
  - Development
  - Optimizely
---

# Creating an Optimizely AddOn - Getting Started

Published: 28th August 2024

When Optimizely CMS 12 was launched in the summer of 2021, I created my first AddOn for Optimizely CMS and talked about some of the lessons I learned in my article [Custom Admin Pages in Optimizely 12](/article/custom_admin_pages_in_optimizely_12). Three years on, I have two highly refined Optimizely AddOns and have had to resolve numerous challenges.   In this new series of articles I will be covering how to create an Optimizely AddOn, how to solve the same challenges I have encountered as well as what I consider to be best practices. You can view examples from across this series within the this [Optimizely AddOn Template](https://github.com/GeekInTheNorth/OptimizelyAddOnTemplate) that I have been creating.

_Please note that all content within this article has been written by myself, however some elements of the copy have been processed with Chat GPT to improve brevity or to create a more formal tone._

## Having a Great Idea

The biggest hurdle to getting started with creating an AddOn is having a good idea. But here is the secret to having a great idea; it doesn't have to be great and it doesn't have to be original. My first AddOn was a very simple UI for managing robots.txt content within CMS 12 and I already knew a package existed for CMS 11 that had not been updated for a number of years. I've now met Mark Everard (the original AddOn author) a number of times and my AddOn has had nearly 200k downloads.

Your AddOn does not need to be pretty, your end user is a CMS editor or administrator, it needs to be easy to understand and it needs to be functional.

Finally, whatever idea you come up with, you need to be passionate about it as it will consume a lot of your time. I average roughly a commit per hour, based on this I have spent 145 hours on Stott Robots Handler and 587 hours on Stott Security. When converted to an average working day, that is 19 and 78 days respectively. You may also never make a single penny, there are many great AddOns out there that are open source, running on an MIT license without a license fee.

## Solution Structure

When creating an AddOn for Optimizely CMS, it is recommended to package it as a single [Razor Class Library (RCL)](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-8.0&tabs=visual-studio). This simplifies the process by consolidating all classes, controllers, razor files, and static content into one NuGet package. This can reduce administrative tasks and potential upgrade issues for users.  An RCL also allows consuming websites to override your Razor files if needed, providing flexibility for UI modifications. However, you must carefully manage file paths to avoid conflicts, the best way to do this is to organize all of your Razor files into a specific path within the Views folder, e.g. `~/Views/MyAddOn/LandingPage.cshtml`.

In the [Optimizely AddOn Template](https://github.com/GeekInTheNorth/OptimizelyAddOnTemplate) repository, the structure of my projects looks like this:

- Sample (Contains just the CMS to test against)
  - SampleCms.sln
  - nuget.config
  - SampleCms
    - SampleCms.csproj (Web Project)
    - ... Other folders and files for just the Sample CMS
- src (contains the source code for the AddOn)
  - OptimizelyAddOn.sln
  - nuget.config
  - OptimizelyAddOn
    - OptimizelyAddOn.csproj (Razor Class Library)
    - Views
      - OptimizelyAddOn
        - Administration
          - Index.cshtml
        - Gadget
         - Index.cshtml
    - ... Other folders and files that make up the AddOn functionality
  - OptimizelyAddOn.Tests
    - OptimizelyAddOn.Tests.csproj (Test Class Library)
    - ... Other folders and files for organised unit tets.

Please note that there is a one-to-one relationship between projects and NuGet packages; each project you add will require its own NuGet package.  Lets say you have one project called MyAddOn.Core and a second project called MyAddOn.Optimizely, you will end up with two NuGet packages: MyAddOn.Core.nupkg and MyAddOn.Optimizely.nupkg.  When developing these, you can use project references and when you package them into nuget files, the project references will automatically be converted into package dependencies.

## JavaScript and Stylesheets In Secure Systems

When I initially developed the user interface for the [Stott Robots Handler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) AddOn, I utilized externally hosted JQuery and Bootstrap JavaScript (JS) and CSS resources. This approach reduced the complexity of launching my AddOn and enabled a rapid entry to the market. I later undertook a comprehensive refactoring of the UI, rebuilding it with React and delivering optimized JS and CSS files directly packaged with the AddOn. This transition ensured that the UI adhered to best architectural and security practices.

When designing a UI for your own AddOn, you will likely encounter similar JavaScript (JS) and stylesheet (CSS) requirements. Both of these elements come with inherent security concerns, particularly in environments governed by a [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). A CSP serves as an allowlist of domains and specifies their permissions on your site. To ensure compatibility and maintain robust security, consider the following guidelines:

Ideally, you should build and distribute optimized and compiled JS and CSS files within your AddOn package within the `wwwroot` folder of your [Razor Class Library (RCL)](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-8.0&tabs=visual-studio). This approach enables the CSP to utilize the `'self'` source directive, allowing your scripts and styles to be safely executed and applied.

Avoid using inline style attributes and JavaScript event handlers. Instead, attach styles and behaviors through classes defined within your JS and CSS files. This practice aligns more closely with CSP standards and significantly enhances security. It is important to note that inline Style attributes and JavaScript event attributes cannot be secured using a `nonce`.

Ensure that the `nonce` attribute of all `script` and `style` elements are populated with a value provided by Optimizely CMS’s `ICspNonceService` interface. For further information, refer to Optimizely's [Content Security Policy](https://docs.developers.optimizely.com/content-management-system/docs/content-security-policy) documentation. Additionally, security AddOns, such as [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely), automatically configure the `ICspNonceService` and integrate it into the CSP for you.

If you choose to utilize JS and CSS resources hosted by third parties, additional precautions are necessary. Ensure that your script and link tags include a [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI) attribute. This attribute enables the browser to verify that the files have not been tampered with by checking them against a specified checksum. Bear in mind that each external resource you employ may require the site consuming your AddOn to adjust its CSP settings to accommodate these resources. Consequently, allowing third-party resources for your AddOn UI could inadvertently permit those resources site-wide.

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

Depending on the Domain of your AddOn, you may wish to provide your consumers with the ability to fine tune access to your AddOn. For [Stott Robots Handler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) and [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) I wanted to give consumers the ability to grant access to the AddOns to specific users such as an SEO Adminstrator or a Developer without granting that user access to the CMS Administrator interface.  In order to do this, you will want to include the ability to define the authentication policy for your AddOn within your service extension:

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
  - Attach styles and events using classes referenced by your JavaScript and Stylesheets.
  - Use `ICspNonceService` to add a `nonce` attribute to your script and style elements.
- Add items into the menu by implementing `IMenuProvider` and decorating it with `[MenuProvider]`
- Do secure all of your controllers to ensure users have to have access to the CMS Interface.
  - Consider using your own Authentication Policy if you want consumers to be able to apply more specific restrictions.
