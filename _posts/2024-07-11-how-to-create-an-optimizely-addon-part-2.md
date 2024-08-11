---
layout: post
title: "Creating an Optimizely CMS Addon - Adding an Editor Interface Gadet"
description: "How to create an editor interface gadget within Optimizely CMS PAAS Core."
permalink: "/article/creating-an-optimizely-addon-part-2"
category:
  - Development
  - Optimizely
---

# Creating an Optimizely CMS Addon - Adding an Editor Interface Gadet

Published: 11th July 2024

In [Part One](/article/creating-an-optimizely-addon-part-1) of this series, I covered getting started with creating your own AddOn for Optimizely CMS 12. This covered having an idea, solution structure, extending the menu interface and authentication.

In Part Two, I will be covering adding an additional editor interface gadget.

## Adding a Gadget to the Editor Interface

Optimizely will search for controllers which are decorated with the `[IFrameComponent]` attribute.  This contains a number of properties which instruct Optimizely on where to use component.  The key properties are:

| Property | Usage |
|----------|-------|
| Title | This should be the name for your gadget and will be visible in the Gadget selector. |
| Description | This is a short description for your gadget and will be visible in the Gadget selector. Do try to stick to one sentence. |
| Categories | This is a suitable category for your gadget. If you are working with content types specifically then this should be "content". |
| Url | This should match the route for your controller action. |
| PlugInAreas | This is a path to where your component should be made available within the system. |
| ReloadOnContextChange | This will cause the UI to reload your Gadget every time you select a different content item within the CMS interface. |

![Gadget Selector in Optimizely CMS 12 Editor Interface](/assets/custom-admin-in-cms-12-4.png)

The following is an example of the bare minimum you will need for your controller.  Note how I include the `[Authorize]` attribute on the controller and the `[HttpGet]` attribute on the action.  This will ensure that the user must be logged in and cannot access your interface with an unexpected HTTP Verb.

```
[Authorize]
[IFrameComponent(
    Url = "/my-addon-controller-route/my-gadget/",
    Title = "My AddOn",
    Description = "My AddOn Description.",
    Categories = "content",
    PlugInAreas = "/episerver/cms/assets",
    MinHeight = 200,
    MaxHeight = 800,
    ReloadOnContextChange = true)]
public sealed class MyAddOnGadgetController : Controller
{
    [HttpGet]
    [Route("/my-addon-controller-route/my-gadget/")]
    public async Task<IActionResult> Index()
    {
        var model = new MyGadgetViewModel();

        return View("~/Views/MyAddOn/MyGadget/Index.cshtml", model);
    }
}
```

When the editor inteface loads your gadget, it will do so with an `id` querystring parameter which contains a versioned content reference in string form.  e.g. `123_456`.  The left hand number is the permenant identity while the right hand side is the specific version of that content item.  You can use this to load the specific content item and use it in the model for your gadget.

In the gadet that I added to [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely), I am interested in just pages and I render the security headers for that page as a preview.  I retrieve the specific page with this helpful method that I call in the action attribute and attach the page to my model.

```
private PageData? GetPageData(HttpRequest request)
{
    var contentReferenceValue = request.Query["Id"].ToString() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(contentReferenceValue))
    {
        return null;
    }

    var contentReference = new ContentReference(contentReferenceValue);
    if (_contentLoader.TryGet<PageData>(contentReference, out var pageData))
    {
        return pageData;
    }

    return null;
}
```

## Telling the CMS Editor Interface About Our AddOn

In order to make the Editor Interface accept our AddOn, it will require us to declare our assembly in a module.config file.  If you have no files to package under the protected modules folder, then this should not be required.  However there appears to be validation on application startup that requires this.

If you are simply adding a gadget for a specific Optimizely CMS build, then you can add your assembly declaration into the module.config file in the root of your website application.  In the context of an AddOn, this should instead be placed in a protected modules folder on a path such as:

`[MyCmsWebsite]/modules/_protected/[MyAddOn]/module.config`

This has some interesting requirements for generating a NuGet package which I will cover in [Part Four](/article/creating-an-optimizely-addon-part-4) as this has some complexity that needs it's own focus.

The following is an example `module.config`.  Note that I have specified an Authorization Policy as an attribute of the module node, this should match the policy required by your full AddOn.  Also note that the full name of the assembly containing your gadget should be added to the assemblies node.

```
<?xml version="1.0" encoding="utf-8" ?>
<module loadFromBin="true" clientResourceRelativePath="" viewEngine="Razor" authorizationPolicy="MyAddOn:Policy" moduleJsonSerializerType="None" prefferedUiJsonSerializerType="Net">
  <assemblies>
    <add assembly="MyAddOnAssemblyName" />
  </assemblies>

  <clientModule>
    <moduleDependencies>
      <add dependency="CMS" />
    </moduleDependencies>
  </clientModule>
</module>
```

## Summary

- Add the `[IFrameComponent]` attribute to your controller to define the gadget for the CMS Editor Interface.
- Add the `[Authorize]` attribute to your controller to secure it.
- Add HTTP verb attributes such as `[HttpGet]` to your controller actions to prevent unexpected access attempts.
- Add a `module.config` file to the `[MyCmsWebsite]/modules/_protected/[MyAddOn]/module.config` folder so that CMS can validate your gadget assembly.