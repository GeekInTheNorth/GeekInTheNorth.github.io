---
layout: post
title: "Stott Security Version 5"
description: "A summary of all new and updated functionality changes that have been introduced in version 5 of the Stott Security add-on for Optimizely CMS 12."
permalink: "/article/stott-security-5"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2024-05-17-stott-security-2-x.md"
  - "_posts/2025-04-08-stott-security-3-x.md"
  - "_posts/2026-01-16-stott-security-4.md"
---

March 2026 marks the release of Stott Security v5, a significant update to the popular web security add-on for Optimizely CMS 12+, with more than 109,000 downloads across nuget.org and nuget.optimizely.com. Below is a high-level overview of what’s new in this release.

- Custom Header Management
- Audit Record Clean Up
- Audit Record Search
- Granular Settings Import

Before we get into the details, we all know that the release of Optimizely CMS 13 is imminent. A CMS 13 compatible version of Stott Security has already been developed and will be updated as we see more previews of CMS 13.  It is my intention to have a day 1 release of this add-on.

## Custom Headers

I have had multiple requests to add functionality that allows users to add or remove custom headers from the response.  The data storage and UI for the existing **Response Headers** UI was inflexible, therefore I have rebuilt this feature from the ground up.

Users can add new headers with any valid header name structure and define a value and a behaviour.  The three behaviours are:

- **Add**: This will add the header to the response and will require a value to be specified.
- **Remove**: This will remove the header from the response.
- **Disabled**: No action will be performed for this header.

For traditional / in-process websites, the order of your middlewares will impact the success rate for removal of headers. Also headers added after the response has been served will not be affected, this means headers added by CloudFlare for example will not be removed.

For Headless users, only headers which have an **Add** behaviour will be available in the current headers API.  I am aiming to create a second version of the headers API to present the data in a different structure in the next release.  At this point the responsibility to remove the headers will take place in the head.

![Custom Headers Interface](/assets/StottSecurityCustomHeaders.png)

> ⚠️ Migration warning: Any configuration on the old Response Headers interface will need to be recreated.

Response Headers that were previously managed through the old interface will need to be reconfigured.  They will appear with a Disabled behaviour and the edit modal will presemt the same friendly options that were available in the previous UI.

## Audit Record Clean Up

Stott Security has long had the ability to Audit changes to the configuration settings, but there has not been any means to clean up the audit records.  A new scheduled job called **[Stott Security] Audit Record Clean Up** has been created that will remove audit records that exceed a configured retention period.  By default this period is set to 2 years, but can be altered during the Add-On configuration by specifying the **AuditRetentionPeriod**.

```C#
services.AddStottSecurity(options =>
{
  options.ConnectionStringName = "EPiServerDB";
  options.NonceHashExclusionPaths.Add("/exclude-me");
  options.AuditRetentionPeriod = TimeSpan.FromDays(730); 
},
authorization =>
{
  authorization.AddPolicy(CspConstants.AuthorizationPolicy, policy =>
  {
    policy.RequireRole("WebAdmins");
  });
});
```

## Audit Record Search

Filtering of audit records has always been present within the system, however it was limited to simple filters for user, operation, record and date range.  Looking for very specific changes was a time consuming exercise.  This changes adds a text filter which will be used to find matches within the following fields:

- Indicator
  - Source for Content Security Policy Sources
  - Directive for Permission Policy directives
  - Header Name for Custom Headers
- Old Value
- New Value

![Audit Interface](/assets/StottSecurityAuditWithFreeTextFilter.png)

> 🙏 **Thank you** to [Samuel Joseph](https://github.com/SamuelJoseph23) for delivering [Add a free text filter to the Audit Screen](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/issues/347).

## Granular Settings Import

The ability to import and export settings was introduced back in version 2.6.0 but was straight forwards in terms of options.  Over time this functionality was updated to support partial imports by ignoring root settings that were null. As part of this release, users now have the ability to choose specifically which settings they want to import.

![Import Settings Modal](/assets/StottSecurityImportSettingsModal.png)

> 🙏 **Thank you** to [Samuel Joseph](https://github.com/SamuelJoseph23) for providing the initial implementation of [Enhance Settings Import Tool](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/issues/346).

## Summary

Stott Security is a free, open-source add-on for Optimizely CMS 12+, designed from the ground up to be accessible to both technical and non-technical users, with built-in audit functionality to provide clear accountability. The add-on supports both PaaS-based traditional headed sites and headless solutions.

Version 5 delivers a major update featuring a rebuilt **Response Headers** functionality with enhanced support for custom headers; enhanced **Audit Management** with configurable retention periods and new free-text search, and a more granular **Settings Import** tool that allows selective configuration.