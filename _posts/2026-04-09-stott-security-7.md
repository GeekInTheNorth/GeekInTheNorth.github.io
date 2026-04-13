---
layout: post
title: "Stott Security Version 7"
description: "Introducing Stott Security v7 which has been built on Optimizely CMS 13 and .NET 10 and updates all features to support and multi application and host configurations."
permalink: "/article/stott-security-7"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2024-05-17-stott-security-2-x.md"
  - "_posts/2025-04-08-stott-security-3-x.md"
  - "_posts/2026-01-16-stott-security-4.md"
  - "_posts/2026-03-05-stott-security-5.md"
---

Stott Security version 7 is now available for **Optimizely PaaS CMS 13**, introducing support for configuring security headers by both **application** and **host**. This aligns the add-on more closely with how Optimizely CMS structures content and delivery, enabling far more precise and maintainable security policies.

![Stott Security Version 7, Content Security Policy Sources tab](/assets/stott-security-7a.png)

## Multiple Application and Host Support

In version 5 and below, Stott Security supported a global Content Security Policy with optional page-level extensions. In practice, this often meant combining requirements for both front-end delivery and the CMS editor experience into a single policy, leading to more permissive and larger configurations.

Version 7 introduces support for Global, Application, and Host-level configuration, allowing the Content Security Policy, Permissions Policy and Response Headers to be scoped more naturally to multi-channel and multi-site platforms.

To support this, a new Context Switcher has been introduced across the add-on UI. This allows users to quickly switch between Global, Application, and Host contexts when managing headers, making it clear exactly where a configuration is being applied.

![Context Switcher modal that allows you to select a global, application or host level context.](/assets/stott-security-7b.png)

### Content Security Policy

Content Security Policy management in Stott Security is designed to minimise the need for developer intervention. The Settings and Sandbox sections can be configured globally and then overridden at Application or Host level, allowing different environments such as the frontend and CMS to operate under different modes (for example, enforcing vs report-only).

The real magic happens around the Sources.  A flexible Content Security Policy (CSP) model isn’t just about defining what’s allowed, it’s about where those rules apply. By structuring CSP across multiple levels, you gain the ability to enforce strong defaults while still accommodating the specific needs of different parts of your platform.

In this model, the sources for the Content Security Policy are applied across four levels of scope and merged to create the final output specific to the page being served. Each level becomes progressively more specific, allowing you to refine policies without weakening your overall security posture.

![Hierarchial Inheritance of the sources for a Content Security Policy, layering from Global, Application, Host and Page level.](/assets/stott-security-7c.png)

- **Global (All Applications)**: Sources configured here define the minimum standard applied everywhere, ensuring unsafe patterns are blocked and trusted sources are consistently enforced.
- **Application**: Sources defined here are applied to all hosts within the specific application.
- **Host**: Sources defined here apply to a specific website domain.  It's at this level that the most specific configuration should be made.  If you configure a specific **Edit** host, then you can have separate Content Security Policies for both the front-end and the CMS.
- **Page**: Sources can be defined at this level by designing Content Pages and Experiences that implement IContentSecurityPolicyPage.  This allows editors to include an iFrame on a specific page without opening the entire site for that domain.

So how would this work in practice? In my primary test instance I configured three separate applications, with each application having a **Primary** host and an **Edit** host.  For my Global level, I implemented the 'self' source across most directives. For my **Edit** host I added all of the additional permissions required by the CMS backend, such as 'unsafe-inline' and https://*.optimizely.com. For my **Primary** host, I added required functionality such as nonce attributes.  The end result was a much more consise and secure Content Security Policy tailored to specific journeys.

### Permissions Policy and Response Headers

Permissions Policy and Response Headers follow a simpler model. These are configured at Global, Application, or Host level using an override approach where more specific levels replace broader ones. A configuration at Application level replaces the configuration at a Global level; a configuration at Host level replaces any configuration at the Application and Global configurations.

![Example of the Response Headers being overridden for a specific appication](/assets/stott-security-7d.png)

### Cross Origin Resource Sharing

The Cross Origin Resource Sharing (CORS) configuration is applied at a webserver level by hooking into .NET Core built-in CORS functionality that addresses incoming traffic to the webserver.  The implementation of this functionality does not yet support the Global, Application or Host level variations.

## What does this mean for Optimizely CMS 12?

Support for CMS 12 is not going away. The new functionality introduced in version 7 will be backported into a version 6 release for CMS 12, where feasible. Ongoing development will continue to target CMS 13 first, with CMS 12 updates following based on demand and compatibility.

I can review the recent download stats on a version by version basis on nuget and I will use this as an indicator of the current market need.  I expect that it will take a few years for a significant portion of customers to move from CMS 12 to CMS 13.  Therefore, I expect to maintain the CMS 12 version for the short to mid term.

## How does the change from Sites to Applications impact the user?

Optimizely CMS 13 introduces Applications in place of Sites, with a shift from GUID-based identifiers to string-based keys. This change breaks the direct relationship with existing configurations (such as security.txt) and requires structural updates to how data is stored.

To simplify migration, version 7 uses a new set of database tables rather than attempting to deal with conflicts between CMS 12 and CMS 13 versions. As a result, users will need to reconfigure headers and security.txt when upgrading—but can use the built-in Import/Export functionality to carry settings across.

## Summary

Stott Security is a free, open-source add-on for Optimizely CMS 12 and CMS 13, designed from the ground up to be accessible to both technical and non-technical users, with built-in audit functionality to provide clear accountability. The add-on supports both PaaS-based traditional headed and headless solutions.

Version 7 delivers a major update targeting Optimizely CMS 13 and .NET 10.  Headers can now be defined at a Global, Application or Host level, providing a more flexible solution.