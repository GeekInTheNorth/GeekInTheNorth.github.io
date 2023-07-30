---
layout: post
title: "Making Content Recommendations Easy For Content Editors"
description: "Making Content Recommendations easy and consistent for content editors using a custom block."
permalink: "/article/making-content-recommendations-consistent-and-easy-for-content-editors"
category:
  - Optimizely
  - Development
---

# Making Content Recommendations Easy For Content Editors

## The Problem
One of our clients had purchased the Content Recommendations module for use within their newly build CMS 12 corporate site.  Our challenge was that the main content team lacked development expertese and would outsource functionality like embedded content to external parties.  On top of this, the client had a desire for consistency in design across the system.  In it's default implementation, the addition of content recommendations across the system would require content editors to make changes to the handlebars scripts for every instance of the block.

## The Solution
Our solution for this was to create a Custom Content Recommendations Block that obfuscates a number of the options on the default Content Recommendations Block and added additional properties that would allow them to render Content Recommendations as if it were the same design as another block within the site.  The key properties that I hid in this case were the Number of Recommendations and Recommendations Template properties.

```
// Display and ContentType attributes omitted for brevity.
public class CustomContentRecommendationsBlock : ContentRecommendationsBlock
{
    public virtual string? Title { get; set; }

    public virtual string? Subtitle { get; set; }

    public virtual bool OmitCardDescriptions { get; set; }

    public virtual string? ReadMoreText { get; set; }

    public virtual ContentReference? FallBackImage { get; set; }

    [ScaffoldColumn(false)]
    public override int NumberOfRecommendations
    {
        get { return 4;}
        set { _ = value; }
    }

    [ScaffoldColumn(false)]
    public override string? RecommendationsTemplate
    {
        get { return "Template is in the razor file."; }
        set { _ = value; }
    }
}
```

The razor file itself was then created to conditionally render elements within the Content Recommendations script tag on the server side in accordance with the designs by our creative team. To handle recommendations which lacked a main image, a fallback image was rendered server side within the `{{^main_image_url}}` handlebars tag.  Markup with `{{^main_image_url}}` is then only rendered by the content recommendations code when the main_image_url is null.

```
{% raw %}
@model CustomContentRecommendationsBlock

<script class="idio-recommendations" type="text/x-mustache" data-api-key="@Model.DeliveryApiKey" data-rpp="@Model.NumberOfRecommendations">
<div class="container">
    <div class="cards-container">

        @if (!string.IsNullOrWhiteSpace(Model.Title) || !string.IsNullOrWhiteSpace(Model.Subtitle))
        {
            <div class="block__intro">
                @if (!string.IsNullOrWhiteSpace(Model.Title))
                {
                    <h2>@Html.PropertyFor(x => x.Title)</h2>
                }
                @if (!string.IsNullOrWhiteSpace(Model.Subtitle))
                {
                    <p>@Html.PropertyFor(x => x.Subtitle)</p>
                }
            </div>
        }

        <div class="cards-rows">
            <div class="cards" data-component="Cards">
                {{#content}}
                <div class="card" data-item>
                    <!-- Teaser Card -->
                    <!-- Image -->
                    {{#main_image_url}}
                        <div class="card__image">
                            <img src="{{main_image_url}}?width=560&height=299&quality=90&rmode=crop" alt="{{title}}">
                        </div>
                    {{/main_image_url}}
                    {{^main_image_url}}
                        @if (!Model.FallbackImage.IsNullOrEmpty())
                        {
                            <div class="card__image">
                                <img src="@Url.ImageUrl(Model.FallBackImage, 560, 299)" alt="@Model.FallBackImage.GetImageAltText()">
                            </div>
                        }
                    {{/main_image_url}}
                    <!-- Category -->
                    {{#topics}}
                        <div class="card__category">{{title}}</div>
                    {{/topics}}

                    <!-- Content -->
                    <div class="card__content">
                        <h4>{{title}}</h4>
                        @if (!Model.OmitCardDescriptions)
                        {
                            <p>{{abstract}}</p>
                        }
                        <a href="{{link_url}}" class="solid-arrow-link" title="{{title}}" data-label_1="{{title}}">@Model.ReadMoreText</a>
                    </div>
                </div>
                {{/content}}
            </div>
        </div>
    </div>
</div>
</script>
{% endraw %}
```

There were additional concerns that had to be addressed, the first being that the design of the block only allowed for a single category (Topic) to be rendered for each content card.  In this case we addressed this by using CSS styles to render hide off all but the first category.

## Alternative Solution

Another approach to the solution would have been for us to look at overriding the default value assigned to the RecommendationsTemplate property so that when new Content Recommendations block was created, it would retain the ability for the content editor to customize the layout of the content recommendations.  This was an approach we chose not to go with in this situation as it still presented non-technical content editors with a technical property that they were not comfortable using.  Our chosen approach also allowed for functionality such as the fall back image to be updated centrally and immediately affect all custom content recommendation blocks within the site.

## Client Expectations vs Reality

Within the CMS, the editor has the ability to prioritise categories that are displayed on cards shown on other blocks and they have the ability to provide an optional Teaser Title and Teaser Description against a page that is used across the site for that page that is different to standard meta data.  The client's expectation was that all of the content recommendations would render the exact same content and categories as if the teaser content had been curated by themselves on a regular block within the site. We had to explain how Content Recommendations worked:

- That Content Recommendations is based on a scan of the fully rendered page
- That Content Recommendations does not have direct access to the raw CMS data.
- That it would not be a live replication of changes within the CMS.
- That Content Recommendations come from the cloud service and not directly from the CMS.

Ultimately the client understood this and is now using the custom content recommendations block across their live site. In our next phase of Content Recommendations, we want to look at pushing additional meta data into Content Recommendations that matches the teaser data defined by the content editor and then hopefully retrieve and display this data within the results from Content Recommendations.
