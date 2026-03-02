---
layout: post
title: "Working With Applications in Optimizely CMS 13"
description: "A short dive into changes from working with Sites to working with Applications in CMS 13."
permalink: "/article/working-with-applications-in-cms13"
category:
  - Development
  - Optimizely
---

>💡**Note:** The following content has been written based on Optimizely CMS 13 Preview 2 and may not accurately reflect the final release version.

As part of my preparation of Stott Security and Stott Robots Handler for PaaS CMS 13, I've had to revisit key functionality in my add-ons that use site definitions.  These add-ons allow a user to define robots.txt, llms.txt and security.txt configurations on a global, per site and per host definition basis.  As a result I need to be able to read out data about the different site configurations.

## Accessing Site / Application Definitions

With CMS 13 taking the lead from SaaS and thinking about more composable architectures, there is a shift from thinking about "sites" and instead thinking about "applications".  There is also a shift to having two different application configurations.  There is the traditional "in-process" CMS application which is represented by the `Website` class, and there is the Headless application which is represented by the `RemoteWebsite` class.  These two applications both inherit the `Application` class.

The existing `ISiteDefinitionRepository` is now deprecated, but functions for now and only returns in-process applications.  In order to access both application types you need to use the new interface of `IApplicationRepository`.  This new repository exposes the following methods for listing applications:

```C#
// In-process applications
var data = await applicationRepository.ListAsync<Website>();

// Headless applications
var data = await applicationRepository.ListAsync<RemoteWebsite>();

// All applications
var data = await applicationRepository.ListAsync();
var data = await applicationRepository.ListAsync<Application>();
```

Another key change with here is that the GUID Id field is now defunct, and while `ISiteDefinitionRepository` still functions, the Id is populated with an empty GUID for compatibility purposes.  The new objects use a `name` property instead and is generated as a sanitized lowercase version of the provided Display Name on creation and then becomes an immutable property.

Another welcome change with `IApplicationRepository` is the shift to asynchronous APIs, which makes it easier to write non-blocking and scalable code, particularly in high-throughput scenarios.

> ⚠️ Migration warning: If you previously keyed configuration by SiteDefinition.Id, you will need a migration strategy to map legacy GUIDs to Application.Name. There is no one-to-one replacement, and the new name is immutable once created.

## Resolving The Current Application

Historically getting the current website for your current page would be accessed by `SiteDefinition.Current`.  This is no longer available and instead we need to use `IApplicationResolver` instead.  This provides access to the following methods:

```C#
// Retrieve the application based on a given host name
var result = applicationResolver.GetByHostname(hostName, fallbackToDefault);
var result = await applicationResolver.GetByHostnameAsync(hostName, fallbackToDefault, cancellationToken);

// Retrieve the application based on a given content reference
var app = applicationResolver.GetByContent(contentReference, fallbackToDefault);
var app = await applicationResolver.GetByContentAsync(contentReference, fallbackToDefault, cancellationToken);

// Retrieve the application based on the current HTTP Context
var app = GetByContext();
var app = await GetByContextAsync(cancellationToken);
```

Decompiling the `DefaultApplicationResolver` I can see that the `GetByContext` methods actually just wrap the `GetByContent` and `GetByHostName` methods and attempt to do this by Content first.  If your functionality needs to operate outside of a content route then it could be better to retieve the application by host name directly, just bear in mind that this returns an `ApplicationHostResolution` rather than an `Application`.

```C#
public async ValueTask<Application?> GetByContextAsync(CancellationToken cancellationToken = default(CancellationToken))
{
    Application application = null;
    ContentReference routedContentLink = _routedContentLinkResolver.RoutedContentLink;
    if (!ContentReference.IsNullOrEmpty(routedContentLink))
    {
        application = await GetByContentAsync(routedContentLink, fallbackToDefault: true, cancellationToken).ConfigureAwait(continueOnCapturedContext: false);
    }

    if (application == null)
    {
        string hostName = _requestHostResolver.HostName;
        (application, _) = await GetByHostnameAsync(hostName, fallbackToDefault: true, cancellationToken).ConfigureAwait(continueOnCapturedContext: false);
    }

    return application;
}
```

## Summary

CMS 13 replaces the traditional concept of sites with applications, supporting both in-process and headless models. While legacy site APIs still exist for compatibility, new development should use IApplicationRepository and IApplicationResolver.

The shift from GUID-based site IDs to immutable application names is the most significant change and has real implications for configuration storage and migration. Although this requires some adjustment, the new application model provides a cleaner and more flexible foundation for modern CMS architectures.