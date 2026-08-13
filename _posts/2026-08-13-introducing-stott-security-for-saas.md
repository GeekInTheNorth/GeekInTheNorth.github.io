---
layout: post
title: "Stott Security for Optimizely SaaS CMS"
description: "Introducing Stott Security for Optimizely SaaS CMS, built for Optimizely Connect Platform using CMS UI Extensions."
permalink: "/article/introducing-stott-security-for-saas"
category:
  - Development
  - Optimizely
  - "Stott Security"
image: "https://www.stott.pro/assets/stott-security-saas-preview-screen.png"
promoImage: "/assets/stott-security-saas-preview-screen.png"
promoImageAlt: "Response Headers preview screen for Stott Security for Optimizely SaaS CMS."
relatedArticles:
  - "_posts/2026-04-30-getting-started-with-stott-security.md"
  - "_posts/2026-03-05-stott-security-5.md"
  - "_posts/2026-05-17-stott-security-6.md"
  - "_posts/2026-04-09-stott-security-7.md"
---

## Introduction

[Stott Security](/article/getting-started-with-stott-security) has been helping developers and editors manage Content Security Policies and security headers on **Optimizely PaaS CMS** for several years. Today I am pleased to share an early access release of **Stott Security for Optimizely SaaS CMS**: a complete rebuild designed for Optimizely's composable platform, built on the **Optimizely Connect Platform (OCP)** and rendered inside the CMS using **CMS UI Extensions**.

## A Complete Rebuild

Optimizely SaaS CMS does not give you a web server to install a NuGet package into, so the add-on model that has served the PaaS version so well simply does not exist there. Instead, extensions are built as apps on the Optimizely Connect Platform and surface their interfaces inside the CMS using CMS UI Extensions. Stott Security for SaaS is exactly that: an OCP app that adds a full-page security console to your CMS and serves your compiled headers to your site's front end from a public endpoint.

Everything about this implementation lives in OCP, and the data belongs to your installation. **Entity Framework and SQL Server are gone**; configuration is now held in OCP's key value storage. This is a much simpler data store, and it does mean some functional changes — relational features of the PaaS version such as the audit history and per-page policies have not carried across. I have set out an honest comparison in the feature parity table below.

What has carried across is the engine. The header compilation engine is a faithful TypeScript port of the C# engine that powers the PaaS add-on, cross-validated against the original so that both products produce the same output. That includes the automatic optimisation and splitting of oversized Content Security Policies across multiple headers so that your policy stays within browser and webserver limits.

The rebuild was also an opportunity to add something the PaaS version has never had: a **draft and publish workflow**. Changes are saved as a draft, and nothing reaches your site until you press **Publish**. Publishing compiles your configuration once and stores the result, so the endpoint your front end calls is a single fast read with no compilation on the hot path. The console always shows you when the live configuration went live and whether unpublished changes exist.

## What You Get Today

The console is split into four tabs: **Response headers**, **Content Security Policy**, **Preview** and **Tools**.

The **Response headers** tab covers eight standard security headers — including X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security and the Cross-Origin family — each with a plain-English description, a behaviour of **Add**, **Remove** or **Disabled**, and a preview of exactly what will be emitted. You can also add your own custom headers.

![The Response headers tab of Stott Security for Optimizely SaaS CMS, showing standard security headers with behaviour, value and preview options.](/assets/stott-security-saas-response-headers-screen.png)

The **Content Security Policy** tab uses the same source-first model as the PaaS version: you manage a list of sources — domains, schemes, keywords, hashes and the `'nonce-random'` placeholder — and grant each source the directives it needs. The Settings section lets you run the policy in report-only mode, upgrade insecure requests and send violation reports to an external collector, while the Sandbox section provides switches for the fifteen sandbox permissions.

![The Content Security Policy Sources tab of Stott Security for Optimizely SaaS CMS, showing sources and the directives granted to each.](/assets/stott-security-saas-csp-sources-screen.png)

The **Preview** tab shows your headers in three views: **Pending** shows what publishing your current draft would produce, **Live** shows what your site's head is being served right now, and **Integration** provides the endpoint for your installation together with a worked example of applying the headers. A diagnostics panel also sits above the console, warning you when a policy is approaching size limits, has been split, or has been dropped entirely.

![The Preview tab of Stott Security for Optimizely SaaS CMS, showing the live headers currently being served to the site head.](/assets/stott-security-saas-preview-screen.png)

Finally, the **Tools** tab provides import and export of the complete configuration as JSON. This matters more on SaaS than it ever did on PaaS: the configuration is held by the app installation, so uninstalling the app deletes it. Keep an exported copy somewhere outside of Optimizely.

![The Tools tab of Stott Security for Optimizely SaaS CMS, showing the export of the complete configuration as JSON.](/assets/stott-security-saas-tools-screen.png)

## Feature Parity

A complete rebuild on a much simpler data store means this is not a feature-for-feature copy of the PaaS add-on. Some features have not carried across, some are on the roadmap, and a couple of things are new to the SaaS product.

| Feature | PaaS | SaaS | SaaS Roadmap |
|-|-|-|-|
| CSP sources & directives | ✔ | ✔ | - |
| CSP Keyword, scheme, hash & nonce sources | ✔ | ✔ | - |
| CSP Report-only mode & upgrade insecure requests | ✔ | ✔ | - |
| CSP sandbox | ✔ | ✔ | - |
| CSP Automatic policy splitting & optimisation | ✔ | ✔ | - |
| External violation reporting | ✔ | ✔ | - |
| Internal violation reporting (Violations tab) | ✔ | ✘ | No current plans |
| Remote CSP Allow List | ✔ | ✘ | No current plans |
| Per-page CSP sources | ✔ | ✘ | No current plans |
| Standard & custom response headers | ✔ | ✔ | - |
| CORS settings | ✔ | ✘ | No current plans |
| Permissions Policy | ✔ | ✘ | Planned |
| Security.txt files | ✔ | ✘ | No current plans |
| Global / Application / Host contexts | ✔ | Global only | Planned |
| Header preview | ✔ | ✔ | - |
| Draft & publish workflow | ✘ | ✔ | - |
| Audit history | ✔ | ✘ | No current plans |
| Import & export | ✔ | ✔ | - |
| Headless headers API | ✔ | ✔ | - |
| Headless middleware for your head | Build your own | Build your own | Planned package |

The biggest omissions follow directly from the storage model: without relational data there is no audit trail, and violation reports are sent to an external collector rather than being stored and summarised inside the CMS. The draft and publish workflow, together with the export tooling, are the counterweights — you can always see what is live and when it went live, and you can keep copies of your configuration outside the platform.

On the roadmap, Application and Host level contexts are a firm commitment — the storage model was designed for them from day one — alongside Permissions Policy management and a distributable middleware package for your front end.

## Plugging It Into Your Headless Solution

Every Optimizely SaaS CMS solution is a headless solution, so applying the headers is always the responsibility of your front end. Your head requests the compiled headers from the endpoint shown on the **Integration** view of the Preview tab and applies them to its responses. An example response looks like this:

```JSON
{
    "headers": [
        {
            "key": "Content-Security-Policy",
            "value": "default-src 'self';...",
            "isRemoval": false,
            "isReplacement": false
        },
        {
            "key": "X-Content-Type-Options",
            "value": "nosniff",
            "isRemoval": false,
            "isReplacement": true
        },
        {
            "key": "server",
            "value": "",
            "isRemoval": true,
            "isReplacement": false
        }
    ],
    "publishedAt": "2026-08-12T00:06:28.000Z",
    "cacheSeconds": 300
}
```

Each entry in the headers collection uses the same structure as the PaaS Header Listing API, so a consumer only needs to implement three behaviours:

- When **isRemoval** is `true`: remove the header from your response.
- When **isReplacement** is `true`: set the header, replacing any existing value.
- Otherwise: append the header to your response. The Content Security Policy is served this way because a large policy may legitimately be split across multiple headers.

Your front end has two further responsibilities: replace the `'nonce-random'` placeholder with a fresh value on every request, and add the `nonce="random"` attribute to script and style elements.

If you want to see what this looks like in practice, [Minesh](https://www.linkedin.com/in/minesh-shah-dev/) has written an excellent walkthrough of building exactly this middleware in Next.js for the PaaS version of Stott Security: [Dynamic CSP Management for Headless and Hybrid Optimizely CMS with Next.js](https://world.optimizely.com/blogs/Minesh-Shah/Dates/2025/9/dynamic-content-security-policy-management-with-optimizely-cms-in-headless-architecture/). Because the header structure is identical, the same middleware approach carries straight over to the SaaS product. The only difference is the envelope: the PaaS API returns a bare array while the SaaS endpoint wraps the array in an object, so a one-line check such as `Array.isArray(body) ? body : body.headers` allows a single middleware implementation to serve both products.

## Get Involved

Stott Security for Optimizely SaaS CMS is in early access, and this is exactly the right time to influence its direction. I would love to hear how you would plug this into your own SaaS headless solution: which framework does your head run on, would the planned middleware package be useful to you, and which of the missing features matter most to your builds?

Like the PaaS add-on, Stott Security for SaaS is free and open source under the MIT licence. If you would like to try it against your own Optimizely SaaS CMS instance then [join the Discussion](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS/discussions/1).  If you want to help shape what comes next, please [raise an issue on the Stott Security for SaaS GitHub repository](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS) — feature requests, integration questions and early access requests are all welcome there.
