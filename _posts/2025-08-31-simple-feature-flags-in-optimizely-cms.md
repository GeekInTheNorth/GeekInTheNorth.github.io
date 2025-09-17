---
layout: post
title: "Simple Feature Flags In Optimizely CMS"
description: "A simple approach to feature flagging within Optimizely CMS."
permalink: "/article/simple-feature-flags-in-optimizely-cms"
category:
  - Development
  - Optimizely
---

# Simple Feature Flags In Optimizely CMS

<i class="fa-solid fa-calendar me-2"></i>Published 31st August 2025

## The Problem

I was working with a CMS 11 client who wanted to introduce two new third party content sources.  These would be synchronized into new specific page types that they would then surface alongside content written directly within the CMS on their listing pages.  Their listing page has the ability to select a subset of content types which will be allowed within the results of the current listng page.  This functionality allows them to use the same Listing Page type to act as a Case Studies listing page or a News Article listing page.

Different parts of the business would be sponsoring each new integration and there was an overlap in terms of related content types and functionality they would be referenced on.  Rather than getting into regular merge conflicts with different branches implementing changes on the same objects I decided to adopt a feature flagging approach.

## The Solution

The first requirement was a static object with a method that could be accessed globally with minimal overhead. As this was a CMS 11 solution built on .NET Framework, I placed the flags in the AppSettings section of the `web.config` file and accessed them through the `ConfigurationManager`.

```c#
public static class FeatureFlagProvider
{
    public const string FeatureOne = "FeatureOne:IsEnabled";
    public const string FeatureTwo = "FeatureTwo:IsEnabled";

    public static bool IsFeatureFlagActive(string featureFlag)
    {
        var featureFlagValue = ConfigurationManager.AppSettings[featureFlag];
            
        if (bool.TryParse(featureFlagValue, out var result))
        {
            return result;
        }

        return false;
    }
}
```

The solution includes a Site Settings content type that holds global content and settings for the site. Both integrations introduced options on the Site Settings content type and added properties to the Listing Page content type. These properties needed to be conditionally hidden based on feature flags. To achieve this, I created a custom attribute inheriting from `ScaffoldColumn`:

```c#
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public class FeatureFlaggedColumnAttribute : ScaffoldColumnAttribute
{
    public FeatureFlaggedColumnAttribute(string featureFlag) : base(FeatureFlagProvider.IsFeatureFlagActive(featureFlag))
    {
    }
}
```

The `ScaffoldColumn` attribute accepts a single boolean indicating whether a property should be visible in the editor UI. My `FeatureFlaggedColumn` attribute instead accepts a string and converts it into a boolean using the `FeatureFlagProvider` which is passed into the base constructor.
Applying this to a property on a content type looks like this:

```c#
[FeatureFlaggedColumn(FeatureFlagProvider.FeatureOne)]
public virtual ContentReference FeatureOneProperty { get; set; }
```

The Listing Page also had a multi-select field allowing editors to select one or more content types to filter Search & Navigation results. I needed to hide the new page types in the selection factory for this field without removing the field itself. The same `FeatureFlagProvider` was used inside the selection factory:

```c#
public class ContentTypesSelectionFactory : ISelectionFactory
{
    public IEnumerable<ISelectItem> GetSelections(ExtendedMetadata metadata)
    {
        yield return new SelectItem 
        { 
            Text = "Existing Page Type One", 
            Value = typeof(ExistingPageOne).FullName 
        };
        yield return new SelectItem 
        { 
            Text = "Existing Page Type Two", 
            Value = typeof(ExistingPageTwo).FullName 
        };

        if (FeatureFlagProvider.IsFeatureFlagActive(FeatureFlagProvider.FeatureOne))
        {
            yield return new SelectItem 
            { 
                Text = "Feature One Page", 
                Value = typeof(FeatureOnePage).FullName 
            };
        }

        if (FeatureFlagProvider.IsFeatureFlagActive(FeatureFlagProvider.FeatureTwo))
        {
            yield return new SelectItem 
            { 
                Text = "Feature Two Page", 
                Value = typeof(FeatureTwoPage).FullName 
            };
        }
    }
}
```

Finally I needed to prevent the new scheduled jobs for the new integrations from running in higher environments where the feature would be turned off.  Again the same `FeatureFlagProvider` was checked and if the feature was disabled, the scheduled job would immediately exit.

```c#
[ScheduledPlugIn(DisplayName = "[Feature One] Content Sync", ...)]
public class FeatureOneSyncScheduledJob : ScheduledJobBase
{
    public override string Execute()
    {
        if (!FeatureFlagProvider.IsFeatureFlagActive(FeatureFlagProvider.FeatureOne))
        {
            return "Feature One Integration is not currently enabled.";
        }

        var results = SynchronizeContent();

        return results.Any() ? string.Join("<br/>", results) : "Complete.";
    }

    private IList<string> SynchronizeContent()
    {
        // Integration Logic Goes Here
    }
}
```

## The Outcome

By using `web.config` transforms for higher environments, I was able to then turn features on or off at an environment level. As a result of this simple feature flagging approach, we were able to release our three features separately with features turned on or off across multiple releases to production like so: 

- Release One
  - Feature One was feature complete and enabled on **Integration** and **Preproduction**.
  - Feature Two was incomplete and enabled on **Integration** only.
  - Feature Three was not yet started.
- Release Two
  - Feature One was released to all environments.
  - Feature Two was incomplete and enabled on **Integration** only.
  - Feature Three was not yet started.
- Release Three
  - Feature Two was feature complete and enabled on **Integration** and **Preproduction**.
  - Feature Three was released to all environments.
- Release Four
  - Feature Two was released to all environments.

## What About CMS 12?

There are more options to consider when it comes to CMS 12 and my approach would likely be different for a CMS 12 solution.  The first thing I would consider is the use of Microsoft's .NET Feature Management package and extending it's usage in the same way.  This package comes with built in support for feature flagging on Routing, Filters and Action Attributes.  There is also support for feature filters to activate a feature flag with a given set of constraints and the SDK is open source. In this specific case, the only functionality I would have used was the ability to check whether a feature flag was enabled.

Another option to consider is whether your client is an Optimizely Feature Experimentation customer.  With Feature Experimentation, your client is able to perform experimentations anywhere within the technical stack, however experimenting on the server side does require a development partnership.  With Feature Experimentation the customer could choose when to enable or disable specific feature flags without an actual deployment needing to take place. There is a C# SDK to support this which is also open source.

- [Microsoft Learn - .NET Feature Management](https://learn.microsoft.com/en-us/azure/azure-app-configuration/feature-management-dotnet-reference)
- [GitHub - .NET Feature Management](https://github.com/microsoft/FeatureManagement-Dotnet)
- [Optimizely - Feature Experimentation](https://www.optimizely.com/products/feature-experimentation/)
- [GitHub - Optimizely Feature Experimentation C# SDK](https://github.com/optimizely/csharp-sdk)
- [Optimizely Developer Documentation - Feature Experimentation C# Example](https://docs.developers.optimizely.com/feature-experimentation/docs/example-usage-csharp)
