---
layout: post
title: "Stott Security Version 3"
description: "A summary of all new functionality and changes that have been introduced to the Stott Security v3 add-on for CMS 12."
permalink: "/article/stott-security-3"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2024-05-17-stott-security-2-x.md"
  - "_posts/2026-01-16-stott-security-4.md"
  - "_posts/2026-03-14-stott-security-5.md"
---

April 2025 marks a new milestone for the Stott Security Add-on with the release of version 3.  This release has been developed over several months owing to a significant new feature among other quality of life changes.

To see the shorter release notes and join the discussion, head over to the releases page on [Github - Stott Security v3.0.0](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/278)

## Permissions-Policy Support

The **Permissions-Policy** HTTP header (formerly **Feature-Policy**) allows developers to control which web features and APIs can be used in the browser, and by which origin. This header can improve security and performance by restricting access to sensitive capabilities such as the camera, microphone, and geolocation.

Currently, support for the **Permissions-Policy** header is mixed. It is well-supported by Chromium-based browsers like Chrome and Edge, but not yet implemented in Firefox or Safari. This naturally raises the question: why invest time in implementing a feature that isn’t universally supported?

According to the latest [browser market share data](https://gs.statcounter.com/browser-market-share), over 70% of users are on browsers that support this header. Additionally, unsupported browsers simply ignore the header, without causing any issues. While I've yet to see a penetration test flag the absence of this header as a vulnerability, I’m increasingly seeing clients request its inclusion as part of their CMS security requirements.

To support this, I’ve added a new **Permissions Policy** screen to Stott Security. This interface allows administrators to enable or disable the **Permissions-Policy** header globally with a single toggle. It also includes a filter bar for quickly narrowing directives by source (URL) or current configuration (e.g., *Disabled*, *Allow None*, *Allow All Sites*, etc.).

![The Permission Policy listing for Stott Security](/assets/StottSecurityPermissionPolicyList.png)

Clicking the **Edit** button for a directive opens a modal where the configuration for that specific directive can be adjusted.

![The Permission Policy modal for a single directive within Stott Security](/assets/StottSecurityPermissionPolicyModal.png)

Available options include:
- Disabled (Omitted this directive from the policy)
- Allow None
- Allow All Sites
- Allow Just This Website
- Allow This Website and Specific Third Party Websites
- Allow Specific Third Party Websites

For configurations involving third-party origins, administrators can specify one or more sources. Input is strictly validated to require only protocol and domain. Wildcards are supported, but only as the first segment after the protocol (e.g., `https://*.example.com`).

All changes to the Permissions Policy are fully audited. Additionally, import/export functionality has been extended to include this new feature.

## Small Features

### .NET 9 Support

If you're building an Optimizely PaaS solution targeting **.NET 9**, you can now integrate Stott Security into your project, regardless of whether your solution is headed, headless, or hybrid.

Stott Security leverages Entity Framework for database access and operations such as migrations. Since each major release of Entity Framework often introduces breaking changes aligned with specific .NET versions, the Stott Security package has been updated to include build targets for **.NET 6**, **.NET 8**, and **.NET 9**, each using the appropriate version of Entity Framework under the hood.

### Import Settings Tool

In previous versions, the import tool required that CSP, CORS, and Response Headers configurations all be present in the import file. To support backwards compatibility with export files created in version 2.x, validation in version 3.x has been relaxed. Now, settings are only applied if they contain a non-null value. This allows for partial imports; if your import file includes only the CSP configuration, then only the CSP settings will be updated, leaving all other settings unchanged.

### X-XSS-Protection Header Warning

The **X-XSS-Protection** header was originally introduced to instruct browsers to enable their built-in XSS filters, aiming to protect users from cross-site scripting attacks. However, the feature introduced its own set of issues. When configured with `X-XSS-Protection: 1; mode=block`, malicious actors could exploit it to trigger denial-of-service conditions by injecting scripts that caused legitimate content to be blocked. Alternatively, when simply enabled without blocking (`X-XSS-Protection: 1`), the header became susceptible to **XS-Search** attacks this is where an attacker submits crafted XSS payloads to probe for differences in application behavior, potentially exposing sensitive data in applications that would otherwise be considered secure.

Although Stott Security continues to support the **X-XSS-Protection** header, it should **only** be set to **disabled** or **omitted entirely**. To help guide users, explanatory notes have been added to the UI outlining current best practices.

It’s worth noting that Chromium-based browsers already ignore this header entirely, but some other browsers have yet to follow suit.

### Content Security Policy Source Updates

Validation has been enhanced to support the **'inline-speculation-rules'** keyword within Content Security Policy (CSP) directives. Speculation rules enable the browser to preload potential navigation targets based on user behavior, improving perceived performance by initiating page loads slightly before user interaction (e.g., clicks).

The **CSP Edit Source** modal in Stott Security has also been updated to ensure that special keywords such as **'unsafe-inline'**, **'unsafe-eval'**, and **'inline-speculation-rules'** can only be added to directives where they are valid. These are typically limited to **script-src**, **style-src**, and their more specific variants.

![Content Security Policy Edit Source modal for Stott Security](/assets/StottSecurityCspModalUpdate.png)

### CMS Editor Gadget Removed

In version 2, I introduced a CMS Editor gadget that displayed the HTTP headers generated when rendering a specific page. This was intended to support the feature allowing users to extend the Content Security Policy (CSP) for individual content items by specifying additional sources.

However, over time it became clear that this approach had several drawbacks:

- The gadget was read-only and appeared automatically for all CMS administrators, even if the page-specific CSP feature wasn't in use. In most cases, this meant the gadget was visible but offered little to no value.
- Some developers experienced installation issues with the Add-on. Specifically, in projects where the `.csproj` excluded the `modules\_protected` folder; often done to avoid conflicts with other third-party Add-ons that add files to the solution multiple times. This resulted in the Stott Security `module.config` being be removed and not re-added. This in turn causes an error during the start up of the solution that could only be resovled by manually adding the into source control and project.

Given the minimal benefit provided by the gadget and the friction it caused in certain build pipelines, I’ve decided to remove it entirely in version 3.

### Obsolete Code Removed

If your solution has been using Stott Security since version 1 then you may find that you are using some obsoleted code.  As part of packaging up version 3, the following items have been removed:

- SecurityServiceExtensions.AddCspManager(...)
  - Replaced by SecurityServiceExtensions.AddStottSecurity(...)
- SecurityServiceExtensions.UseCspManager()
  - Replaced by SecurityServiceExtensions.UseStottSecurity()
- CspReportingViewComponent
  - Replaced by Report-Uri and Report-To within the CSP.

### Report To Endpoint Fixes

The **report-uri** directive has been deprecated within the content security policy.  The specification for this endpoint was for it to receive a single CSP Report per request with a content type of `application/csp-report`.  With the introduction of the **report-to** directive, browsers are now meant to send a collection of CSP Reports in an array with a content type of `application/reports+json`.  The intent being to reduce the number of requests being made to any reporting endpoint.

Some browsers appear to have simply started sending a single report payload to the **report-to** endpoint in a similar fashion to how they were reporting to the **report-uri** endpoint instead of matching the specification.  The result is a lot of bad requests being returned and a host of reports being lost.  I have updated the **report-to** endpoint so that it can handle both payloads based on their respective content types.

As part of reducing the overall size of the Content Security Policy within hotfix 3.0.2, the **report-uri** directive is no longer generated for either internal or external reporting endpoints.  The UI for setting external reporting endpoints has been updated to reflect this.

### Smart Optimization of the Content Security Policy

A recent issue reported by some users revealed that Content Security Policies (CSPs) with over 250 source entries could exceed the 16KB header size limit imposed by Cloudflare. This limit, [documented here](https://developers.cloudflare.com/workers/platform/limits/#response-limits), applies a 16KB limit per unique header name and a 32KB limit across all headers (32KB). When the CSP exceeds this threshold, the browser may time out while loading the page, despite the web server successfully returning the response to Cloudflare, making the issue difficult to diagnose. To ensure broad compatibility, many recommend keeping individual headers below 8KB.

Starting in version 3.0.2 of Stott Security, CSPs are now intelligently split into [multiple CSP Headers](https://content-security-policy.com/examples/multiple-csp-headers/) if their size approaches the 8KB limit. Since browsers enforce the most restrictive policy among multiple CSP headers, these headers are carefully divided based on directive hierarchy and fallback behavior.

If a header grows beyond 12KB, additional logic is applied to consolidate directives as follows:

- `script-src-elem` and `script-src-attr` are merged into `script-src`.
- `style-src-elem` and `style-src-attr` are merged into `style-src`.
- `frame-src` and `worker-src` are merged into `child-src`.
- Any omitted directives falling back to `default-src` are added explicitly, defaulting to `'self'` if needed.

As a final safeguard, if the combined size of all CSP headers approaches the 16KB Cloudflare limit, the CSP will not be generated to avoid unexpected failures.
