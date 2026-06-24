---
layout: post
title: "Stott Security Version 6"
description: "Stott Security v6 brings the multiple site and host configuration features from v7 to Optimizely CMS 12, adapting them to the CMS 12 Site-based architecture."
permalink: "/article/stott-security-6"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2024-05-17-stott-security-2-x.md"
  - "_posts/2025-04-08-stott-security-3-x.md"
  - "_posts/2026-01-16-stott-security-4.md"
  - "_posts/2026-03-05-stott-security-5.md"
  - "_posts/2026-04-09-stott-security-7.md"
---

Stott Security version 6 is now available for **Optimizely PaaS CMS 12**, bringing the support for configuring security headers by both **site** and **host** that was introduced in version 7 for CMS 13. This functionality has been migrated down to CMS 12 and adapted to work naturally with the established **Site** based architecture, enabling far more precise and maintainable security policies.

![Stott Security Version 6, Content Security Policy Sources tab](/assets/stott-security-6a.png)

## Multiple Site and Host Support

In version 5 and below, Stott Security supported a global Content Security Policy with optional page-level extensions. In practice, this often meant combining requirements for both front-end delivery and the CMS editor experience into a single policy, leading to more permissive and larger configurations.

Version 6 introduces support for Global, Site, and Host-level configuration, allowing the Content Security Policy, Permissions Policy and Response Headers to be scoped more naturally to multi-channel and multi-site platforms.

To support this, a new Context Switcher has been introduced across the add-on UI. This allows users to quickly switch between Global, Site, and Host contexts when managing headers, making it clear exactly where a configuration is being applied.

![Context Switcher modal that allows you to select a global, site or host level context.](/assets/stott-security-6b.png)

### Content Security Policy

Content Security Policy management in Stott Security is designed to minimise the need for developer intervention. The Settings and Sandbox sections can be configured globally and then overridden at Site or Host level, allowing different environments such as the frontend and CMS to operate under different modes (for example, enforcing vs report-only).

The real magic happens around the Sources.  A flexible Content Security Policy (CSP) model isn’t just about defining what’s allowed, it’s about where those rules apply. By structuring CSP across multiple levels, you gain the ability to enforce strong defaults while still accommodating the specific needs of different parts of your platform.

In this model, the sources for the Content Security Policy are applied across four levels of scope and merged to create the final output specific to the page being served. Each level becomes progressively more specific, allowing you to refine policies without weakening your overall security posture.

![Hierarchial Inheritance of the sources for a Content Security Policy, layering from Global, Site, Host and Page level.](/assets/stott-security-7c.png)

- **Global (All Sites)**: Sources configured here define the minimum standard applied everywhere, ensuring unsafe patterns are blocked and trusted sources are consistently enforced.
- **Site**: Sources defined here are applied to all hosts within the specific site.
- **Host**: Sources defined here apply to a specific website domain.  It's at this level that the most specific configuration should be made.  CMS 12 sites already define an **Edit** host alongside their primary host(s), so if you configure sources against that **Edit** host, you can have separate Content Security Policies for both the front-end and the CMS.
- **Page**: Sources can be defined at this level by designing Content Pages and Experiences that implement IContentSecurityPolicyPage.  This allows editors to include an iFrame on a specific page without opening the entire site for that domain.

So how would this work in practice? In my primary test instance I configured three separate sites, with each site having a **Primary** host and an **Edit** host.  For my Global level, I implemented the 'self' source across most directives. For my **Edit** host I added all of the additional permissions required by the CMS backend, such as 'unsafe-inline' and https://*.optimizely.com. For my **Primary** host, I added required functionality such as nonce attributes.  The end result was a much more consise and secure Content Security Policy tailored to specific journeys.

### Permissions Policy and Response Headers

Permissions Policy and Response Headers follow a simpler model. These are configured at Global, Site, or Host level using an override approach where more specific levels replace broader ones. A configuration at Site level replaces the configuration at a Global level; a configuration at Host level replaces any configuration at the Site and Global configurations.

![Example of the Response Headers being overridden for a specific site](/assets/stott-security-6d.png)

### Cross Origin Resource Sharing

The Cross Origin Resource Sharing (CORS) configuration is applied at a webserver level by hooking into .NET Core built-in CORS functionality that addresses incoming traffic to the webserver.  The implementation of this functionality does not yet support the Global, Site or Host level variations.

## What does upgrading from version 5 involve?

Upgrading from version 5 is intentionally straightforward.  Optimizely CMS 12 retains the familiar Site model, where each site is uniquely identified using a GUID.  Because that identifier is unchanged, the relationship between your existing configuration—such as security headers and security.txt—and the sites they were configured against is preserved across the upgrade.

This means there is no need to reconfigure your existing settings.  The new Site and Host scoping simply layers on top of what you already have; anything previously configured continues to apply at the Global level, and you can begin refining it at the Site and Host levels whenever you are ready.

This is a notable contrast to the CMS 13 path.  In CMS 13, the shift from GUID-based Sites to string-based Applications broke the direct relationship with existing configurations, so version 7 introduced a new set of database tables and required users to reconfigure their headers and security.txt (with the Import/Export tooling available to help carry settings across).  No such migration is necessary when moving to version 6 on CMS 12.

## What does this mean for Optimizely CMS 13?

Optimizely CMS 13 remains the lead development target.  New functionality is built for version 7 first and then backported into a version 6 release for CMS 12, where feasible.  Version 6 brings the headline multiple site and host functionality in line with version 7, adapted to the CMS 12 architecture.

I can review the recent download stats on a version by version basis on nuget and I will use this as an indicator of the current market need.  I expect that it will take a few years for a significant portion of customers to move from CMS 12 to CMS 13.  Therefore, I expect to maintain the CMS 12 version for the short to mid term.

## Summary

Stott Security is a free, open-source add-on for Optimizely CMS 12 and CMS 13, designed from the ground up to be accessible to both technical and non-technical users, with built-in audit functionality to provide clear accountability. The add-on supports both PaaS-based traditional headed and headless solutions.

Version 6 brings the major Global, Site and Host configuration model to Optimizely CMS 12, continuing to target .NET 6, 8, 9 and 10.  Headers can now be defined at a Global, Site or Host level, providing a more flexible solution—without requiring any reconfiguration of your existing settings.
