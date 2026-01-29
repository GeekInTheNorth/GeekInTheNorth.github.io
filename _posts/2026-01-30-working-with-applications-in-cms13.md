---
layout: post
title: "Working With Applications in Optimizely CMS 13"
description: "A deep dive into changes from working with Sites to working with Applications in CMS 13."
permalink: "/article/stott-security-4"
category:
  - Development
  - Optimizely
---

>💡**Note:** The following content has been written based on Optimizely CMS 13 Preview 2 and may not acurately reflect the final release version.

As part of my preparation of Stott Security and Stott Robots Handler for PaaS CMS 13, I've had to revisit key functionality in my add-ons that use site definitions.  These add-ons allow a user to define robots.txt, llms.txt and security.txt configurations on a global, per site and per host definition basis.  As a result I need to be able to read out data about the different site configurations.

## Accessing Site / Application Definitions

With CMS 13 taking the lead from SaaS and thinking about more composable architectures, there is a shift from thinking about "sites" and instead thinking about "applications".  There is also a shift in to having 2 different application configurations.  There is the traditional "in-process" CMS application that comes complete with multiple host definitions and there is the Headless application type which is agnostic of host definitions.  These two application types are represented as the following classes:

- Website : Application
- RemoteWebsite : Application

The existing `ISiteDefinitionRepository` is now deprecated, but functions for now and only returns in-process applications.  The replacement interface is `IApplicationRepository`.

```C#
// Returns in-process applications only
var data = await applicationRepository.ListAsync<Website>();

// Returns headless applications only
var data = await applicationRepository.ListAsync<RemoteWebsite>();

// Returns both types
var data = await applicationRepository.ListAsync();
var data = await applicationRepository.ListAsync<Application>();
```

Another key change with here is that the GUID Id field is now defunct, and while `ISiteDefinitionRepository` still functions, the Id is populated with an empty GUID for compatability purposes.  The new objects use a `name` property instead and is generated as a sanitized lowercase version of the provided Display Name.

| Site Definition | Website | RemoteWebsite |
|-|-|-|
| a | b | c |

Another great change with the move to `IApplicationRepository` is the shift to asynchronous methods which will allow us to write more performant methods.

## Resolving The Current Site

SiteDefinition.Current

IApplicationResolver applicationResolver

var application = await applicationResolver.GetByContextAsync();