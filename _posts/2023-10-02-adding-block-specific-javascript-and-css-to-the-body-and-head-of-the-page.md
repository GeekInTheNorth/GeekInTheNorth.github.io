---
layout: post
title: "Adding Block Specific JavaScript and CSS to the body and head of the page"
description: "Using the ClientResource management within Optimizely CMS to render JavaScript and CSS resources correctly within the rendered HTML document."
permalink: "/article/adding-block-specific-javascript-and-css-to-the-body-and-head-of-the-page"
category:
  - Development
  - Optimizely
---

# Adding Block Specific JavaScript and CSS to the body and head of the page

<i class="fa-solid fa-calendar me-2"></i>Published: 2nd October 2023

A common requirement for CMS implementations includes the ability to embed third party content into a website as if it formed part of the website itself.  Sometimes this takes the form of a full page embed like a campaign page and in other cases this can be smaller artefacts within an embed block placed between differing blocks within the flow of a page.  Often these embeds come with additional JavaScript and Stylesheet content, which in turn can lead to a Content Security Policy being opened up for an entire site for a single embed on a single page.

The following block provides three separate properties:

- Embed Code: A text area that will be rendered in it's raw state on a razor file.
- Hosted JavaScript File: A content reference for an optimized production JavaScript file that has been uploaded to the CMS to be used by this block and rendered at the bottom of the body of the page.
- Hosted CSS File: A content reference for an optimized production stylesheet file that has been uploaded to the CMS to be used by this block and rendered within the head element of the page.

```
[ContentType(
    DisplayName = "Embed Block",
    GUID = "0de2bdc7-9fc1-407d-8a60-2c2fb0e0b85a",
    Description = "Allows the content editor to embed third party code snippets.",
    GroupName = SystemTabNames.Content)]
public class EmbedBlock : BlockData
{
    [Display(
        Name = "Embed Code",
        Description = "Please paste the full snippet of code to included within the HTML for the page and block.",
        GroupName = SystemTabNames.Content,
        Order = 10)]
    [UIHint(UIHint.Textarea)]
    [Required]
    public virtual string? EmbedCode { get; set; }

    [Display(
        Name = "Hosted JavaScript File",
        Description = "A CMS Hosted JavaScript file to be rendered at the bottom of the 'body' element.",
        GroupName = GroupNames.Content,
        Order = 20)]
    [AllowedTypes(typeof(JavaScriptContent))]
    [CultureSpecific]
    public virtual ContentReference? JavaScriptFile { get; set; }

    [Display(
        Name = "Hosted CSS File",
        Description = "A CMS Hosted Cascading Style Sheet file to be rendered at the bottom of the 'head' element.",
        GroupName = GroupNames.Content,
        Order = 40)]
    [AllowedTypes(typeof(CssContent))]
    public virtual ContentReference? CssFile { get; set; }
}
```

When a block is rendered within a content area, any attempt to render the sources for the JavaScript and CSS files will end up being rendered within the container for the block. If you are using the standard razor rendering method for pages within the website, you will have used `@Html.RequiredClientResources(RenderingTags.Header)` to render Optimizely generated styles within the header of the page and scripts within the footer of the body.  In this case we can consume the built in Client Resources functionality and register our files to be placed appropriately within the document.

```
public sealed class EmbedBlockViewComponent : BlockComponent<EmbedBlock>
{
    private readonly IUrlResolver _urlResolver;

    public EmbedBlockViewComponent(IUrlResolver urlResolver)
    {
        _urlResolver = urlResolver;
    }

    protected override IViewComponentResult InvokeComponent(EmbedBlock currentContent)
    {
        if (!ContentReference.IsNullOrEmpty(currentContent.JavaScriptFile))
        {
            ClientResources.RequireScript(_urlResolver.GetUrl(currentContent.JavaScriptFile)).AtFooter();
        }

        if (!ContentReference.IsNullOrEmpty(currentContent.CssFile))
        {
            ClientResources.RequireStyle(_urlResolver.GetUrl(currentContent.CssFile)).AtHeader();
        }

        return View(currentContent);
    }
}
```

The `ClientResources.RequireScript` and `ClientResources.RequireStyle` methods will ensure that the resources are rendered once per unique file name.  This means that if you have two blocks which reference the same JavaScript file, then that JavaScript file is rendered once within the HTML document.  Now this is great, but what if you need to defer these embedded resources in order to improve your website performance?

Both of these methods come with additional methods that allow you to define the name for the resource, it's dependencies and it's additional attributes.  For example, the following call:

```
ClientResources.RequireScript(
    _urlResolver.GetUrl(currentContent.JavaScriptFile),
    currentContent.JavaScriptFile.ID.ToString(), // A nominated unique name for the javascript file
    new List<string>(0), // Dependencies
    new Dictionary<string, string> { { "defer", "defer" } } // Additional Attributes
    ).AtFooter();
```

Will result in the follow script tag being rendered:

```
<script defer="defer" src="/globalassets/embeds/test.js"></script>
```

You can extend this same functionality to render externally hosted files with additional attributes, which could include cross origin and subresource integrity hashes like the following example:

```
var externalJavaScript = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
var externalJavaScriptSri = "sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL";

var attributes = new Dictionary<string, string>
{
    { "defer", "defer" },
    { "crossorigin", "anonymous" },
    { "integrity", externalJavaScriptSri }
};

ClientResources.RequireScript(
    externalJavaScript,
    externalJavaScript, // A nominated unique name for the javascript file
    new List<string>(0), // Dependencies
    attributes
    ).AtFooter();
```

Which would then render like so:

```
<script crossorigin="anonymous" defer="defer" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
```

## In Summary

When constructing an Optimizely CMS website that allows the embedding of JavaScript and CSS resources, leverage the use of the static `ClientResources.RequireScript` and `ClientResources.RequireStyle` static methods within your controllers and view components to register your resources in order to:

- Ensure that Stylesheet resources are rendered correctly within the header
- Ensure that JavaScript resources are rendered correctly at the bottom of the body
- Ensure that all resources are rendered uniquely
- Ensure that all resources are rendered with standard attributes for performance.
 
