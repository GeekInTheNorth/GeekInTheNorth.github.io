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

Published: 30th August 2024

In [Part One](/article/creating-an-optimizely-addon-part-1) of this series, I covered getting started with creating your own AddOn for Optimizely CMS 12. This covered having an idea, solution structure, extending the menu interface and authentication. In Part Two, I will be covering adding an additional editor interface gadget. You can view examples from across this series within the this [Optimizely AddOn Template](https://github.com/GeekInTheNorth/OptimizelyAddOnTemplate) that I have been creating.

_Please note that all content within this article has been written by myself, however some elements of the copy have been processed with Chat GPT to create a more formal tone._

## Adding a Gadget to the Editor Interface

Optimizely will identify controllers marked with the [IFrameComponent] attribute, which contains several properties that guide Optimizely on how and where to utilize the component. The primary properties are as follows:

| Property | Usage |
|----------|-------|
| Title | The name of the gadget, visible in the Gadget selector. |
| Description | A brief description of the gadget, also visible in the Gadget selector. It is recommended to keep this to one sentence. |
| Categories | The appropriate category for the gadget. For content-specific gadgets, this should be set to "content" or "cms" |
| Url | The route corresponding to your controller action. |
| PlugInAreas | The location within the system where the component should be made available. |
| ReloadOnContextChange | Enables the UI to reload the gadget each time a different content item is selected within the CMS interface. |

![Gadget Selector in Optimizely CMS 12 Editor Interface](/assets/custom-admin-in-cms-12-4.png)

Below is an example of the minimum required setup for your controller. Note the inclusion of the [Authorize] attribute on the controller and the [HttpGet] attribute on the action. These ensure that the user is authenticated and that the interface cannot be accessed using an unexpected HTTP verb.

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

When the editor interface loads your gadget, it will include an id query string parameter containing a versioned content reference in string format (e.g., 123_456). The number on the left represents the permanent identity of the content, while the number on the right denotes the specific version of that content item. This information can be used to load the particular content item and incorporate it into your gadget's model.

In the gadget I developed for [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely), I focus exclusively on pages, rendering the security headers for the selected page as a preview. I retrieve the specific page using a method that I invoke in the action attribute, subsequently attaching the page to my model.

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

To enable the Editor Interface to recognize our AddOn, it is necessary to declare our assembly in a `module.config` file. Although this step might not be required if there are no files to package under the protected modules folder, it appears that validation during application startup mandates this configuration.

For those simply adding a gadget to a specific Optimizely CMS build, the assembly declaration can be included in the `module.config` file located at the root of your website application. However, in the context of an AddOn, this declaration should be placed within a protected modules folder, using a path such as:

`[MyCmsWebsite]/modules/_protected/[MyAddOn]/module.config`

This setup introduces specific considerations when generating a NuGet package, which I will address in [Part Four](/article/creating-an-optimizely-addon-part-4) due to the complexity involved.

Below is an example of a `module.config` file. Note the inclusion of an Authorization Policy as an attribute of the module node; this should correspond to the policy required by your AddOn. Additionally, ensure that the full name of the assembly containing your gadget is listed within the assemblies node.

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
