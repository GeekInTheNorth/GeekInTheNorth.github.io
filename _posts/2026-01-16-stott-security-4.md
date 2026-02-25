---
layout: post
title: "Stott Security Version 4"
description: "A summary of all new and updated functionality changes that have been introduced in version 4 of the Stott Security add-on for Optimizely CMS 12."
permalink: "/article/stott-security-4"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2025-04-08-stott-security-3-x.md"
  - "_posts/2026-01-16-stott-security-4.md"
  - "_posts/2026-03-14-stott-security-5.md"
---

January 2026 marks the release of Stott Security v4, a significant update to the popular web security add-on for Optimizely CMS 12, with more than 109,000 downloads across nuget.org and nuget.optimizely.com. Below is a high-level overview of what’s new in this release.

- Features
  - Manage security.txt files
  - Improved nonce and hash support
  - UI rebuilt with Vite
  - .NET 10 support
- Bug fixes
  - Conditional output of HSTS headers

## Manage Security.txt Files

A security.txt file provides a standardized way for security researchers to report vulnerabilities by clearly defining contact details and disclosure policies. This helps ensure that security issues are reported responsibly and reach the appropriate team quickly. Stott Security allows you to manage security.txt content globally, per site, or even per host, and serves it from the standard path /.well-known/security.txt. You can read more about the specification on the official <a href="https://securitytxt.org/" target="_blank">security.txt website</a>.

The UI for managing security.txt content will be familiar to users of Stott Robots Handler. The core functionality has been carried across and enhanced with minor behavioural adjustments and security.txt specific guidance. While there are recommended formats for security.txt, real-world implementations vary widely, so this initial release supports free-form content entry and links to the official security.txt site, where a useful generator is available.

![A screenshot of the security.txt maintenance screen](/assets/stott-security-securitytxt-management.png)

As with all features in Stott Security, changes to security.txt content are fully audited. However, security.txt files are intentionally excluded from the security header import and export functionality. Security headers are applied site-wide, whereas security.txt content can vary by site and host and is typically simple to copy between environments when required.

## Improved Nonce and Hash Support

Previously, Nonce support for script and style elements was enabled via a single, all-or-nothing option in the CSP Settings screen. In version 4, the **Generate Nonce** and **Use Strict Dynamic** options have been removed from **CSP Settings** and are now configured as sources within the **CSP Sources** screen. This change allows for more granular control over CSP configuration. Existing installations will have their settings automatically migrated during upgrade to preserve current behaviour.

![A screenshot of the content security policy Nonce source modal](/assets/stott-security-nonce-source.png)

Support for hashes has also been added to the CSP Sources list, with validated support for SHA-256, SHA-384, and SHA-512. While hash-based CSP rules are now fully supported, they are generally not the recommended primary approach. Where possible, nonce attributes should be applied to script and style elements, inline scripts and styles should be avoided, and nonce support should be used within GTM-injected tags.

It is important to note that Optimizely CMS does not natively support nonce or hash attributes in the Editor and Admin interfaces. These interfaces do not apply nonce attributes to script or style elements, and the client-side Quick Navigator gadget injects page-specific data into inline script blocks. As a result, a unique hash would be required for every page. Enabling nonce or hash support therefore requires disabling the Quick Navigator widget.

To provide deterministic control over where nonce and hash functionality is applied, version 4 introduces configurable exclusion paths. Requests routed to these paths, or any sub-paths beneath them, will have nonce and hash sources automatically removed from the generated Content Security Policy.

```C#
services.AddStottSecurity(cspSetupOptions =>
{
    cspSetupOptions.ConnectionStringName = "EPiServerDB";
    cspSetupOptions.NonceHashExclusionPaths.Add("/exclude-me");
},
authorizationOptions =>
{
    authorizationOptions.AddPolicy(CspConstants.AuthorizationPolicy, policy =>
    {
        policy.RequireRole("WebAdmins", "Everyone");
    });
});
```

By default the following paths are already added to the Nonce and Hash exclusion list:
- /episerver
- /ui
- /util
- /stott.robotshandler
- /stott.security.optimizely

## Framework Updates

When I started Stott Security, the UI was built using **Create React App** and this was my first full React UI.  Since then, the **Create React App** way of building React UI has been deprecated.  To bring the UI up to date, I have rebuilt the UI using Vite and I've taken the opportunity to update all dependencies.

An extra compilation target has been added for .NET 10.  Historically I've had to compile for multiple versions of .NET due to breaking changes in Entity Framework.  In order to maintain backwards compatibility for existing users, this now means I am compiling for .NET 6, 8, 9 and 10.  When CMS 13 is released, I will be reducing my compilation targets to just .NET 10 for CMS 13.

## Small Changes

- The **Strict-Transport-Security** header will now only be included in HTTPS responses in alignment with best practices. See: <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security" target="_blank">MDN : Strict-Transport-Security header</a>
- The "Add Content Delivery API Headers" button on the CORS has been renamed and will add all of the following headers for both the Content Delivery and Definition APIs:
  - x-epi-contentguid
  - x-epi-branch
  - x-epi-siteid
  - x-epi-startpageguid
  - x-epi-remainingroute
  - x-epi-contextmode
  - x-epi-continuation

## Closing Thoughts

Stott Security is a free, open-source add-on for Optimizely CMS 12, designed from the ground up to be accessible to both technical and non-technical users, with built-in audit functionality to provide clear accountability. The add-on supports both PaaS-based traditional headed sites and headless solutions.

For existing users, this release aims to enhance flexibility and modernise key areas without disrupting established configurations. For those new to Stott Security, version 4 provides a solid, standards-aligned foundation for securing Optimizely CMS applications.