---
layout: post
title: "Build it Once (A proposal for CMS 12 builds)"
description: "A proposition for using Razor Class Libraries and componentising Optimizely CMS 12 builds to reduce long term effort and rebuilding."
permalink: "/article/build_it_once"
category:
  - Development
  - Optimizely
---

# Build it Once (A proposal for CMS 12 builds)

Published: 8th March 2023

## Introduction

The following is based on a 30 minute presentation performed by myself at Optimizely North in Manchester on the 1st March 2023.  Some of this content is based on question and answer sections performed on the day as well as observing builds that I have contributed to that have origins both internal and external to the agency that I am currently with. It should be noted that this is the proposition of an approach to help reduce the duplication of effort and to allow developers to focus on what is truely unique to a client.

## The Problem

As Agencies we build sites for multiple customers and commonly end up building a lot of the same components over and over again.  Most agencies have considered at least one solution to how we can save our development teams from repeating the same tasks with every single build.  Solutions including:

- Having a starter solution that all client builds start from.
  - Optimizely have similar solutions such as Alloy, Quicksilver and Foundation, however these may not fit in with coding standards or architectural standards of individual agencies.
- Having a folder of pre-built common components that are copied into a new build that are then modified for the specific client

These are essentially a copy and paste situations and do ultimately save on some time within a new website build and as part of this presentation and now blog, I attempt to offer another possible solution if we consider a change in how we build Optimizely websites.

## The Technology

Optimizely CMS 12 has now been available to the community for 18+ months and as part of the shift to .NET 6+, we have a new development tools available that we can use to componentise our builds.  A personal favourite of mine is the [Razor Class Library](https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-7.0&amp;amp;amp;tabs=visual-studio) (RCL) which I have used now to build two different plugins for Optimizely CMS 12.  A Razor Class Library is a standard class library that can also contain Razor files and static assets within it's own wwwroot folder.  These can in turn be packaged as their own NuGet package or dll that contains it's own razor files and static assets that can be added to any other build.

The great thing about Razor Class Libraries is that if you do not specify a layout file for your razor files within the library, the layout file from the website consuming the Razor Class Library will be used instead.  And if you provide a Razor file on the same folder structure as that contained within the Razor Class Library, the razor file from the consuming website is used in place of the razor file in the razor class library.  This allows you to optionally replace the render for any given component packaged within the Razor Class Library.

_For example:_

In my [demo build](https://github.com/GeekInTheNorth/opti-north-feb-2023) for this topic I structured the code into three separate projects:

- OptiNorthDemo.Core
  - This project contained common assets that would theoretically be utilized by all product based projects.
- OptiNorthDemo.News
  - This project contained components that made up a news feature including:
    - A News Article Page
    - A News Listing Page
    - News Listing and filtering logic
  - This project could then be expanded to contain additional News features:
    - Releated News Block
    - Front end News Listing component built using the preferred framework of your agency (e.g. React)
- OptiNorthDemo
  - This project was the base website for the demo which then referenced OptiNorthDemo.News and OptiNorthDemo.Core as NuGet packages.

This solution contains a Razor file on the path of **OptiNorthDemo.News/Views/NewsArticlePage/Index.cshtml** and when I ran the solution the razor file from that path was used to render the article.  When I then added a razor file on the path of **OptiNorthDemo/Views/NewsArticlePage/Index.cshtml**, the razor file from the OptiNorthDemo project was used instead while all of the existing business logic and controller logic from the **OptiNorthDemo.News** project facilitated the program flow.

## The Proposition

If we analyze all that we build across all of the websites we currently manage / develop, we should be able to identify common themes or features.  We should then be able to identify what makes these individual features work well and design a content structure and business logic structure that should fulfil the needs of most if not all usages of that feature.  We should then fully build out that feature and manage it as a product. 

Going back to our news example again, a single Razor Class Library would reference our core package and then contain the News Article Page, News Listing page, a Related News Block and all of the core business logic that makes it work e.g. Optimizely Search and Navigation queries, API endpoints and frontend listing and search components.

In order to make this work, we need to think of our content structures in a more Atomic Content way.  This means less fixed fields and page flow and more thought about flexible content block usage.  We also need to think about minimising the usage of Content Type restrictions to targeting interfaces that allow specific functional categories of blocks.  For example, we can think of blocks as "Hero Blocks" for use at the top of pages, "Content Blocks" as core page content and as "Related Blocks" as additional content that could follow core page content.  All of these would have to be declared in a core project that all of our feature would use.  e.g.

    namespace OptiNorthDemo.Core.Blocks;
    
    using EPiServer.Core;
    using EPiServer.Shell;
    
    /// <summary>
    /// Used to define a standard content block to be allowed in main content areas.
    /// This combined with <see cref="ContentBlockUiDescriptor"/> simplify these declarations.
    /// </summary>
    public interface IContentBlock : IContentData
    {
    }
    
    /// <summary>
    /// Used to help Optimizely CMS UI Recognize the <see cref="IContentBlock"/> interface.
    /// This allows us to simplify which blocks are allowed in main content areas.
    /// </summary>
    [UIDescriptorRegistration]
    public class ContentBlockUiDescriptor : UIDescriptor<IContentBlock>
    {
    }

Going back to our News Page example, we would inherit a base set of page properties from the core project and then apply our content area restrictions based on interfaces defined within the core project but implemented either in additional packages or directly within a client specific build.

    [ContentType(DisplayName = "News Article Page", Description = "A flexible news article page.", GUID = "DADC30C2-7F68-45F3-B279-FD4446B9B3CA", GroupName = GroupNames.Content)]
    public class NewsArticlePage : SitePageData
    {
       // Some other news article specific fields...
    
        [Display(
           Name = "Article Content",
           Description = "A content area that allows blocks that have been specifically designed as core content.",
           GroupName = GroupNames.Content,
           Order = 110)]
       [AllowedTypes(typeof(IContentBlock))]
       public virtual ContentArea? ArticleContent { get; set; }
    
        [Display(
           Name = "Additional Content",
           Description = "A content area that allows blocks that have been specifically designed as related content.",
           GroupName = GroupNames.Content,
           Order = 120)]
       [AllowedTypes(typeof(IRelatedContentBlock))]
       public virtual ContentArea? AdditionalContent { get; set; }
    }

As agencies it is common to sell development time.  The dream here with this approach is to allow us to sell Value and Time.  So lets imagine that a client comes in and as part of their discovery they understand that they need an Optimizely Site, that it comes with Case Studies, News, Events, Products, General Content etc.  As part of applying that cost we turn around to the client and we give them the something closer to the following list of made up numbers:

- Case Studies: £20,000 package plus 3 days for customization
- News: £20,000 package plus 3 days for customization
- Products: 20 days develop and build (product properties vary wildly between business types)

The end result being less time spent developing the common stuff and being able to either improve profit margins or do more for our clients with their budgets.

## Problems with this approach

It is not expected that that this would be achieveable to fulfill for all possible agencies to use a single feature.  Each agency will have it's own coding standards, it's own preferred list of plugins they like to use within each of their builds, it's own preferred architectural structures and frontend libraries.  e.g. different agencies might have frontend teams that specialise in React, Angular, Vue etc.  It is also expected that this would only work if you are adopting a more Atomic content structure with minimal content type and block type restrictions.

### 1. Who looks after this and how do we stop it going out of date?
To keep a product or feature up to date, it needs to be allocated a Product Owner, someone who is responsible for the product or feature and ensuring it is not forgotten.  After it's initially been built, keeping the module up to date can either be factored in to the additional needs of a specific client or the needs of keeping packages up to date.

### 2. What if a client leaves and our NuGet feed is internal?
For any given feature, this would require the NuGet reference is removed from the website project and the matching version of the project is added to the solution.  This would mean that you should version each "release" of a given feature and ensure that the relevant commit within the repository is correctly tagged with the release version to make this task as easy as possible.

### 3. What if I need to change the structure of the markup for a specific build?
This would be a simple case of creating a new razor file on the same path but within the client specific website.

### 4. What if there are properties that client does not need that I want to hide?
It is possible to create an **EditorDescriptor** that is decorated with the **EditorDescriptorRegistration** attribute and then use this to hide properties from the CMS editor.  In the following code snippet I have created a base **EditorDescriptor** called **HideDefaultFieldsEditorDescriptor** and then created additional classes which inherit from **HideDefaultFieldsEditorDescriptor** and simply have the correct target field types applied.  This logic is executed when a field is rendered within the CMS interface and then sets it's visibility to false if it is within a given list of hidden page and properties.

    [EditorDescriptorRegistration(EditorDescriptorBehavior = EditorDescriptorBehavior.PlaceLast, TargetType = typeof(ContentArea))]
    public class HideDefaultContentAreasEditorDescriptor : HideDefaultFieldsEditorDescriptor
    {
    }
    
    [EditorDescriptorRegistration(EditorDescriptorBehavior = EditorDescriptorBehavior.PlaceLast, TargetType = typeof(DateTime?))]
    public class HideDefaultDateTimesEditorDescriptor : HideDefaultFieldsEditorDescriptor
    {
    }
    
    public class HideDefaultFieldsEditorDescriptor : EditorDescriptor
    {
        public override void ModifyMetadata(ExtendedMetadata metadata, IEnumerable<Attribute> attributes)
        {
            base.ModifyMetadata(metadata, attributes);
    
            var contentType = metadata.FindOwnerContent()?.GetOriginalType()?.Name;
            var propertyName = metadata.PropertyName;
            if (ShouldHideField(contentType, propertyName))
            {
                metadata.ShowForEdit = false;
            }
        }
    
        private static bool ShouldHideField(string? contentType, string? propertyName)
        {
            var hiddenFields = new List<Tuple<string, string>>
            {
                new("NewsArticlePage", "AdditionalContent"),
                new("NewsArticlePage", "DisplayPublishedDate")
            };
    
            return hiddenFields.Any(x =>
                string.Equals(x.Item1, contentType, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(x.Item2, propertyName));
        }
    }

## In Summary

With the advent of .NET 6+, CMS 12 and the concept of Atomic Content, are we now truely in a place where we can conceptualize content features as packages that are built once and installed into multiple clients and then customized to match their design?  With the power of Razor Class Libraries we are now able to create extensible collections of content features, the question does remain if we are able to make that next leap forward into selling value.

## References

- <https://learn.microsoft.com/en-us/aspnet/core/razor-pages/ui-class?view=aspnetcore-7.0&tabs=visual-studio>
- <https://github.com/GeekInTheNorth/opti-north-feb-2023>
