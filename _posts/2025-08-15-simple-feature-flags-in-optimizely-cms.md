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

Published 15th August 2025

## The Problem

I was working on a CMS 11 client who wanted to introduce two new third party content sources.  These would be synchronized into new specific page types that they would then surface alongside content written directly within the CMS on their listing pages.  Their listing page has the ability to select a subset of content types which will be allowed within the results of the current listng page.  This functionality allows them to use the same Listing Page type to act as a Case Studies listing page or a News Article listing page.

Different parts of the business would be sponsoring each new integration and there was a cross over in terms of related content types and functionality they would be referenced on.  Rather than getting into regular merge conflicts with different branches implementing changes on the same objects I decided to adopt a feature flagging approach.

## The Solution

The first thing I needed was a static object with a static method that could be accessed anywhere with minimal fuss.  As this was a CMS 11 solution which is built on .NET Framework, I chose to put my flags directly into the AppSettings of the web.config file.

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

!TODO : Add a CMS 12 version

Both integrations had options that were configurable on a Site Settings content type and introduced new properties and options on the Listing Page content type.  This meant that I needed to conditionally hide properties based on a feature flag.  To make this possible, I created a attribute that inherited from the `[ScaffoldColumn(false)]` attribute:

```c#
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public class FeatureFlaggedColumnAttribute : ScaffoldColumnAttribute
{
    public FeatureFlaggedColumnAttribute(string featureFlag) : base(FeatureFlagProvider.IsFeatureFlagActive(featureFlag))
    {
    }
}
```

The `ScaffoldColumn` attribute only takes one parameter, a boolean.  This allowed me to provide the name of the feature flag in the constructor of the `FeatureFlaggedColumn` attribute and then to convert it into a bool in the `base(...)` method using my new `FeatureFlagProvider`.  Implementing this for a single property on a content type is then as simple as follows:

```c#
[FeatureFlaggedColumn(FeatureFlagProvider.FeatureOne)]
public virtual ContentReference FeatureOneProperty { get; set; }
```

My listing page had a multi-select field allowing the content editor to choose from a subset of page types to include in the results.  I needed to hide the content types that supported the new integrations on higher environments, but I did not want to hide the field itself.  The same static `FeatureFlagProvider` was then used directly within the selection factory for that property:

```c#
public class ContentTypesSelectionFactory : ISelectionFactory
{
    public IEnumerable<ISelectItem> GetSelections(ExtendedMetadata metadata)
    {
        yield return new SelectItem { Text = "Existing Page Type One", Value = typeof(ExistingPageOne).FullName };
        yield return new SelectItem { Text = "Existing Page Type Two", Value = typeof(ExistingPageTwo).FullName };

        if (FeatureFlagProvider.IsFeatureFlagActive(FeatureFlagProvider.FeatureOne))
        {
            yield return new SelectItem { Text = "Feature One Page ", Value = typeof(FeatureOnePage).FullName };
        }

        if (FeatureFlagProvider.IsFeatureFlagActive(FeatureFlagProvider.FeatureTwo))
        {
            yield return new SelectItem { Text = "Feature Two Page", Value = typeof(FeatureTwoPage).FullName };
        }
    }
}
```

Finally I needed to prevent the new scheduled jobs for the new integrations from running in higher environments where the feature would be turned off.  Again the same FeatureFlagProvider was checked and if the feature was disabled, the scheduled job would immediately exit.

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