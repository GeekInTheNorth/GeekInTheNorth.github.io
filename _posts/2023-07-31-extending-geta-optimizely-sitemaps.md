---
layout: post
title: "Extending Geta Optimizely Sitemaps to Include Image Sitemaps"
description: "Enhancing Geta Optimizely Sitemaps to include Images by overriding the SitemapXmlGenerator."
permalink: "/article/extending-geta-optimizely-sitemaps-to-include-image-sitemaps"
category:
  - Development
  - Optimizely
---

# The Requirement

One of our Optimizely CMS 12 clients has a media heavy site which includes media that may otherwise be undetected by google when indexing content, this could be an image that is resolved via a Javascript method or a separate asynchronous request.  One part of our SEO brief for this client was to include an Image XML Sitemap to improve visibility of said media to search engines such as google.  For all of our CMS 12 builds, we like to use the Geta Optimizely Sitemaps plugin as this puts a lot of power into the hands of content editors and SEO specialists.  Unfortunately for this particular client, the plugin does not handle image sitemaps.

## Image XML Sitemap Format

There are actually two different ways to implement an image XML sitemap.

### Image only XML Sitemap

In this format, the image node sits beneathly below the urlset node and exists once per image within your site:

```
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <image:image>
        <image:loc>https://www.example.com/image-1.jpg</image:loc>
        <image:caption>Everything you need to know about Images</image:caption>
        <image:geo_location>London, United Kingdom</image:geo_location>
        <image:title>Image Sitemap Example</image:title>
        <image:license>Creator: Acme, Credit Line: Acme SEO, Copyright Notice: Free to Use</image:licence>
    </image:image>
</urlset>
```

Initially I thought that the level of information packaged with the image was excellent as it added a lot of context.  However as of May 2022, all nodes except image:image and image:loc were deprecated and are no longer consumed by google.  I also tied setting up a sitemap within Geta Optimizely Sitemaps that used an image asset node as it's root and this included decorating the image content types with the sitemap configuration properties, however this just resulted in an empty sitemap.xml.

### Standard XML Sitemap with images

In this format, the image nodes sit beneath the url node and exists once per image that should be found on that page:

```
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com/sample1.html</loc>
    <lastmod>2023-07-03T16:29:07+01:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
    </image:image>
    <image:image>
      <image:loc>https://example.com/photo.jpg</image:loc>
    </image:image>
  </url>
  <url>
    <loc>https://example.com/sample2.html</loc>
    <image:image>
      <image:loc>https://example.com/picture.jpg</image:loc>
    </image:image>
  </url>
</urlset>
```

In this format, the context of an image is directly related to the page, but other than defining that the image exists, no additional context is provided.  This format did however have the benefit of being able to follow the content tree.

## The Solution

The core generation functionality for XML sitemaps within Geta Optimizely Sitemaps comes down to one primary abstract class called SitemapXmlGenerator and all the XML Sitemap formats all inherit and extend this class by overriding specific methods.  The core logic has been split out into lots of different methods, each with a single responsibility that has been marked as virtual to allow for them to be individually overridden.

The first step was to implement a new class that inherits the SitemapXmlGenerator and to then override the dependency injection by replacing Geta's own implementation of their standard sitemap generator with our new custom class:

```
public class StandardAndImageSitemapXmlGenerator : SitemapXmlGenerator, IStandardSitemapXmlGenerator
{
    public StandardAndImageSitemapXmlGenerator(
        ISitemapRepository sitemapRepository,
        IContentRepository contentRepository,
        IUrlResolver urlResolver,
        ISiteDefinitionRepository siteDefinitionRepository,
        ILanguageBranchRepository languageBranchRepository,
        IContentFilter contentFilter,
        IUriAugmenterService uriAugmenterService,
        ISynchronizedObjectInstanceCache objectCache,
        IMemoryCache cache,
        ILogger<StandardSitemapXmlGenerator> logger)
        : base(
            sitemapRepository,
            contentRepository,
            urlResolver,
            siteDefinitionRepository,
            languageBranchRepository,
            contentFilter,
            uriAugmenterService,
            objectCache,
            cache,
            logger)
    {
    }
}
```

```
public static class GetaOptimizelySitemapsServiceExtension
{
    public static IServiceCollection AddGetaOptimizelySitemapsHandler(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSitemaps();

        // Geta injects the generators as Transient, so maintain the same scoping:
        serviceCollection.AddTransient<IStandardSitemapXmlGenerator, StandardAndImageSitemapXmlGenerator>();

        return serviceCollection;
    }
}
```

The first method that needed to be overridden is called GenerateRootElement and this is responsible for creating the urlset node and adding the standard namespace for an XML sitemap.  In our case we need to add an additional namespace for the image sitemaps:

```
public class StandardAndImageSitemapXmlGenerator : SitemapXmlGenerator, IStandardSitemapXmlGenerator
{
    private readonly ILogger<StandardSitemapXmlGenerator> _logger;
    private readonly XNamespace _imageNamespace;
    private readonly XAttribute _imageAttribute;

    public StandardAndImageSitemapXmlGenerator(...) : base(...)
    {
        _logger = logger;

        _imageNamespace = XNamespace.Get("http://www.google.com/schemas/sitemap-image/1.1");
        _imageAttribute = new XAttribute(XNamespace.Xmlns + "image", _imageNamespace.NamespaceName);
    }

    protected override XElement GenerateRootElement()
    {
        var rootElement = new XElement(SitemapXmlGenerator.SitemapXmlNamespace + "urlset", _imageAttribute);

        if (this.SitemapData.IncludeAlternateLanguagePages)
            rootElement.Add((object)new XAttribute(XNamespace.Xmlns + "xhtml", (object)SitemapXmlGenerator.SitemapXhtmlNamespace));
        return rootElement;
    }
}
```

This overridden method is a clone of the base method, in order for the image namespace to be rendered correctly within the XML document, we have to create the image attribute as a direct child of the urlset node at the point in time the node is created.  Attempting to use the base method and then appending the XAttribute led to undesired prefixing of namespaces within the parent node.

The next step was to make sure content types had a common method that could be used to return images that should be included with the page in the XML sitemap, this could easily be a property instead that could be in the hands of the CMS Editor.  This would also need to be identifiable to the generation logic, so I added an interface that could be used to identify pages with images:

```
public interface ISitePageWithSitemapImages : IContent
{
    IList<ContentReference> SitemapImages { get; }
}

public class SitePageData : PageData, ISitePageWithSitemapImages
{
    public virtual IList<ContentReference> GetSitemapImages()
    {
        var images = new List<ContentReference>();

       // Image resolution logic goes here and is overridden for different content types

        return images;
    }
}
```

The final part of the puzzle is then to override the GenerateSiteElement method within the SitemapXmlGenerator.  This method's responsibility is to create the URL node and all of it's child elements.  In this case I was able to leverage the base method, then if the page being implemented my interface, additional logic would then parse and add the image nodes:

```
public class StandardAndImageSitemapXmlGenerator : SitemapXmlGenerator, IStandardSitemapXmlGenerator
{
    private readonly ILogger<StandardSitemapXmlGenerator> _logger;
    private readonly XNamespace _imageNamespace;
    private readonly XAttribute _imageAttribute;

    // Constructor and GenerateRootElement go here

    protected override XElement GenerateSiteElement(IContent contentData, string url)
    {
        var pageElement = base.GenerateSiteElement(contentData, url);
        var urlResolverArgs = new UrlResolverArguments { ForceAbsolute = true };
        
        if (contentData is ISitePageWithSitemapImages pageData)
        {
            try
            {
                foreach (var sitemapImage in pageData.GetSitemapImages())
                {
                    var imageUrl = UrlResolver.GetUrl(sitemapImage, "en", urlResolverArgs);
                    var image = new XElement(_imageNamespace + "loc", (object)imageUrl);
                    pageElement.Add(new XElement(_imageNamespace + "image", image));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Oh No!");
            }
        }

        return pageElement;
    }
}
```

The final generated XML Sitemap looks like this (please note I've sanitised the URLs generated here):

```
<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://localhost:5000/en/test-page-one/</loc>
        <lastmod>2023-07-03T16:29:07+01:00</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
        <image:image>
            <image:loc>https://localhost:5000/globalassets/images/image-one.jpg</image:loc>
        </image:image>
        <image:image>
            <image:loc>https://localhost:5000/globalassets/images/image-two.jpg</image:loc>
        </image:image>
    </url>
    <url>
        <loc>https://localhost:5000/en/test-page-two/</loc>
        <lastmod>2023-07-07T14:44:30+01:00</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
        <image:image>
            <image:loc>https://localhost:5000/globalassets/images/image-three.jpg</image:loc>
        </image:image>
        <image:image>
            <image:loc>https://localhost:5000/globalassets/images/image-four.jpg</image:loc>
        </image:image>
    </url>
</urlset>
```

## Conclusion

The end result is that we can generate XML Sitemaps with image elements.  Some consideration needs to be made around your own implementation and how you want to manage images.  Do you want your SEO team to be able to curate this or do you want it to be automated through some custom logic?  This could be enhanced futher to include video elements and news elements. More details around these XML Sitemap variants can be found here: https://moz.com/learn/seo/xml-sitemaps.

### Limitations

There are some additional considerations to be made in terms of the size of XML Sitemaps here, especially if you start adding all of the media types.  Here are some limitations extrapolated from google's developer documentation (worth a read around best practices): https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

- Maximum XML Sitemap file size: 50MB
- Maximum number of URL nodes per sitemap: 50000
- Maximum number of Image nodes per URL node: 1000
- Maximum number of News nodes per URL node: 1000
- Maximum number of Video nodes per URL node: 1000? (This is based on other limits, but was not overtly declared on google's guidance)