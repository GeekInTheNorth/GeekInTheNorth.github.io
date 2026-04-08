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

Stott Security version 7 is now available for **Optimizely PaaS CMS 13**.  This is includes support for variation of configuration by application and host name.

![Stott Security Version 7, Content Security Policy Sources tab](/assets/stott-security-7a.png)

## Multiple Application and Host Support

For a long time, the Stott Security module only supported one set of headers for the global solution and only allowed for the Content Security Policy to vary on a page specific basis.  Often this meant that you had to include sources required by both the front end and back end of your website into one policy, leading to bloating.  Changing to allow your headers to vary by application has long been on the cards but with different ideas about how the implementation could look.

As part of delivering this, I've added a new Context Switcher component that will be visible on many pages.  This will allow a user to select a Global, Application or Host context when editing security headers.

![Context Switcher modal that allows you to select a global, application or host level context.](/assets/stott-security-7b.png)

### Content Security Policy

Management of your Content Security Policy has always been designed to be user friendly, removing the barriers that would normally require developer intervention. The Settings and Sandbox sections are straight forward, they can be configured globally and they can be overridden at an Application or Host level.  This allows you to separately set one website into report only mode while another is correcly applying restrictions.

The real magic happens around the Sources.  A flexible Content Security Policy (CSP) model isn’t just about defining what’s allowed, it’s about where those rules apply. By structuring CSP across multiple levels, you gain the ability to enforce strong defaults while still accommodating the specific needs of different parts of your platform.

In this model, CSP is applied across four levels of scope:

Global → Application → Host → Page

Each level builds on the one above it, becoming progressively more specific.

![Hierarchial Inheritance of the sources for a Content Security Policy.](/assets/stott-security-7c.png)

#### 1. Global (All Applications) - The Baseline

The Global policy defines the default rules for your entire platform. This is your security foundation—the rules that apply everywhere unless explicitly refined further down the chain. It ensures a consistent baseline and prevents accidental gaps in protection. Typical responsibilities include:

- Defining default source directives (script-src, style-src, etc.)
- Blocking unsafe patterns globally
- Establishing organisation-wide trusted domains

#### 2. Application – Content Grouping by Context

The application level allows you to define rules which apply to a specific application.

## How does the change from Sites to Applications impact the user?