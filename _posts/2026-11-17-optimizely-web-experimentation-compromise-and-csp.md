---
layout: post
title: "Lessons From the Optimizely Web Experimentation Compromise"
description: "How a compromised Optimizely snippet served malware via major brands' websites, why a restrictive CSP stopped it, and how Stott Security helps you run one."
permalink: "/article/optimizely-web-experimentation-compromise-and-csp"
category:
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2026-04-30-getting-started-with-stott-security.md"
  - "_posts/2025-08-01-optimize-your-csp.md"
  - "_posts/2026-08-13-introducing-stott-security-for-saas.md"
  - "_posts/2026-04-09-stott-security-7.md"
---

## Introduction

On 16th November 2026, Scott Helme and the team at Report URI published [a detailed investigation](https://blog.report-uri.com/worlds-largest-brands-infected-with-malware-via-optimizely/) into malicious JavaScript being served to visitors of some of the world's largest brands through Optimizely Web Experimentation. Optimizely have since [acknowledged the incident](https://status.optimizely.com/incidents/ftw0fh9wx43z), confirming that "an unauthorized party exploited a vulnerability in Experimentation" and that "We've fixed the vulnerability and removed the injected code from affected projects."

The vulnerability is closed, but the lesson is bigger than one vendor. This attack is a textbook example of the problem a Content Security Policy (CSP) exists to solve, and Report URI's data shows a clear split between the sites that had a restrictive policy and the sites that did not. In this article I summarise what happened, explain which parts of a CSP made the difference, and look at how [Stott Security](/article/list/stott-security) helps you build and maintain that kind of policy on Optimizely CMS 12, CMS 13 and SaaS CMS.

## What Happened

Optimizely Web Experimentation works by adding a single script tag to your site, which loads a per-project snippet from `cdn.optimizely.com`. That snippet can include an optional **Project JavaScript** field that contains custom code that runs on every page where the snippet loads.

An attacker gained write access to the Project JavaScript of many unrelated customer projects and added a small loader to it. Everything else about the delivery looked normal. The snippet came from Optimizely's own domain, over Optimizely's own certificate, through the same script tag that each site had always used. As Report URI put it: "Optimizely's CDN served exactly what it was given; this was not a CDN cache-poisoning attack."

Report URI found the loader in 188 snippets belonging to 178 organisations out of 1,611 snippets checked, and expects that the real number is higher. The affected organisations span banking and finance, technology, retail, streaming, news, airlines, healthcare, telecoms and more. Report URI's article lists them in full.

The loader appeared in three forms:

1. A script tag pointing to `https://1688360.cc/track.js`.
2. The same URL hidden behind base64 decoding with `atob()`.
3. A full inline copy of the payload executed with `eval()`, used as a fallback where the domain was blocked.

Once running, the payload:

- Swapped cryptocurrency wallet addresses in page text, form fields, the clipboard and outgoing requests.
- From 13:43 UTC, skimmed card numbers, expiry dates and CVVs from forms and sent them to the attacker using `navigator.sendBeacon`.
- Stole cookies that were not marked `HttpOnly`, along with screenshots of the page.
- On iPhones and iPads, loaded further scripts from two more attacker-controlled hosts to deliver exploit kits targeting iOS 13 through to iOS 18.

The first injection was seen at 04:21 UTC. The bulk of the clean-up happened between roughly 20:40 and 21:10 UTC, and the last infected file was cleaned at 23:11 UTC. Some sites served malware to their visitors for almost 19 hours.

## Why Trusting Optimizely Was Not Enough

If your site runs Optimizely Web Experimentation under a CSP, your policy almost certainly allows `https://*.optimizely.com` in `script-src`. That is correct and necessary, but it only tells the browser where code is allowed to come from. It says nothing about whether that code is honest. The malicious Project JavaScript came from a trusted origin, so it ran. In Report URI's words: "Allowing cdn.optimizely.com was never going to help."

What a CSP can still control is everything that happens next. After the initial snippet, each stage of the attack needed the browser to do something new:

| Attack stage | What it needed from the browser | Directive that controls it |
|-|-|-|
| Load `track.js` from `1688360.cc` | A script from a new host | `script-src` |
| Run the inline fallback | `eval()` | `script-src` without `'unsafe-eval'` |
| Send card details, cookies and screenshots to the attacker | A connection to a new destination | `connect-src` |
| Load the iOS exploit scripts | Scripts from two more new hosts | `script-src` |

Report URI checked the CSPs of the affected organisations' own websites. Of the sites they evaluated:

- **68** had no CSP at all.
- **50** had a CSP that allowed both the payload and the data theft.
- **17** allowed the payload to run but blocked the theft through `connect-src`. Wallet address swapping still worked on these sites, because it happens entirely within the page.
- **24** blocked the payload outright.

Their conclusion: "What separated the 24 protected sites from the rest was a restrictive script-src."

### Two settings that undid otherwise good policies

**`'strict-dynamic'`** changes how the browser decides which scripts to trust. Without it, every script is checked against the hosts listed in `script-src`. With it, the browser works from a chain of trust instead:

1. A script is trusted if it carries a valid nonce or hash, such as the `<script>` tag that loads your Optimizely snippet.
2. Any script that a trusted script creates and adds to the page is also trusted, wherever it is loaded from.
3. Host sources such as `https://*.optimizely.com` and `'self'` are ignored by browsers that support `'strict-dynamic'`. They stay in the policy only as a fallback for older browsers.

This is a strong defence against cross-site scripting. An attacker who injects a `<script>` tag into your HTML cannot know the nonce, so their script never runs. It also saves you from maintaining a long allow list for tag managers and other loaders that pull in scripts from hosts you cannot predict. One of the example policies in [Optimizely's own CSP guidance](https://docs.optimizely.com/web-experimentation/docs/update-your-site-s-content-security-policies-csp) uses a nonce with `'strict-dynamic'`.

The weakness is that the chain of trust is only as good as the script at the start of it. In this attack, the trusted Optimizely snippet was the thing adding `track.js` to the page, so the browser passed its trust straight on to `1688360.cc`. With the host allow list ignored, there was nothing left to check the new host against.

**`'unsafe-eval'`** allows strings to be executed as JavaScript. Optimizely's documentation explains that some features, such as audiences with custom JavaScript conditions, need it. Report URI found one large bank where `track.js` and the data theft were both blocked, but the inline fallback still ran because the policy allowed `'unsafe-eval'`.

Neither setting is wrong in every situation. Removing `'strict-dynamic'` means every host your scripts load from must be listed explicitly, which is more work to maintain. Removing `'unsafe-eval'` may mean giving up some Optimizely features. Both are trade-offs worth making deliberately, rather than settings to copy from an example.

## Where Stott Security Fits

To be clear about what Stott Security does: it manages the security headers your site sends, and the browser enforces them. It does not inspect the JavaScript that Optimizely serves, and it would not have stopped the malicious code from arriving in your Optimizely snippet. What it does is make the kind of restrictive policy that protected those 24 sites practical to build, maintain and change quickly.

### An allow list you can maintain without a deployment

Stott Security takes a source-first approach to CSP: you add each source and grant it only the directives it needs. `https://*.optimizely.com` can be granted `script-src` and `connect-src` without your analytics provider getting the same. A strict allow list without `'strict-dynamic'` does mean more upkeep, because every new third party needs a new source. Because CMS administrators can add a source without a code deployment, that upkeep does not fall on your release pipeline. That removes the main reason teams fall back on broad wildcards or `'strict-dynamic'`.

### Separate policies for your CMS and your visitors

The Optimizely CMS Editor has additional CSP requirements, including `'unsafe-inline'` and `'unsafe-eval'` in typical configurations. These requirements differ from those of the public-facing website. If your editors and your visitors share a single host, those relaxations end up in the policy your visitors receive, including the same `'unsafe-eval'` that let the inline fallback run.

Stott Security version 6 (CMS 12) and version 7 (CMS 13) let you configure your CSP at Global, Application and Host level. Your Edit host keeps the relaxations the editor needs, while your Primary host runs a tight policy. I cover how to set this up in [Why Configure Separate UI and CMS Backend Hosts](/article/getting-started-with-stott-security#why-configure-separate-ui-and-cms-backend-hosts). On SaaS CMS the editor is hosted by Optimizely, so your front-end policy never needs to make room for it.

If you are using earlier versions of Stott Security which do not support separate CMS and Frontend Content Security Policies; Consider tightening your frontend CSP and use a middleware to remove the CSP for the CMS backend.

### Seeing the violations

Every time the browser blocks something, it can send a violation report. A site with a restrictive policy and reporting turned on would have received reports for `1688360.cc` as soon as the loader reached it. Report URI also points out that their detection signals only require a CSP in report-only mode, so you can gather this evidence without risking breaking your site.

Stott Security supports report-only mode and violation reporting on every edition. On CMS 12 and CMS 13, internal reporting endpoints place violations on the **CSP Violations** screen inside the CMS. Every edition, including SaaS, can also send reports to an external collector. The Violations screen is a place to review reports, not an alerting system. If you want to be told about a new domain within minutes, pair Stott Security with a dedicated reporting service such as Report URI. Stott Security manages the policy, and the reporting service watches what browsers report back.

> **Be careful with one-click allow.** The CSP Violations screen lets you add a blocked domain to your policy with a single click. That is handy for the legitimate tag someone forgot to mention, but it is also the button that would have allowed `1688360.cc`. Always find out what a domain is before you allow it.
{: .callout}

Report-only mode on its own detects but does not protect. Use it to tune your policy, then move your Primary host to enforcing mode and keep reporting switched on.

### Responding without a deployment

When an incident like this breaks, you want to act in minutes, not wait for a release window. Because your configuration is managed in the CMS, you can:

- Remove `'unsafe-eval'` or `'strict-dynamic'` from your front-end policy.
- Restrict `connect-src` to destinations you recognise. This directive controls where JavaScript can send data to and fetch data from, covering `fetch()`, `XMLHttpRequest`, WebSockets and `navigator.sendBeacon()`, which is how this payload sent card details to the attacker. Limiting it to your own site and the services you actually use means a malicious script that does run cannot send what it collects to a new host. This is what stopped the data theft on 17 of the affected sites.
  - Keep `img-src` tight too, because image requests are a common fallback for sending data and are controlled separately.
- Review your CSP sources for broad scheme sources such as `http:`, `https:`, `ws:` and `wss:`. When specified without a hostname, these act as wildcards for the corresponding scheme, potentially allowing resources or connections to any host using that scheme. A specific hostname allowlist does not restrict these broader permissions.

On CMS 12 and CMS 13 every change is audited, giving you a record of what changed, when and by whom for your incident report. On SaaS CMS the draft and publish workflow, together with the **Live** view on the Preview tab, shows exactly what your site is being served. Either way, allow for any caching between Stott Security and your visitors, such as your CDN or your headless front end.

## The Limits of a CSP

A CSP limits where code can come from and where data can go. It cannot tell whether code from a trusted origin is honest. If the attacker had put the entire payload directly into Project JavaScript, with no `eval()` and no new script hosts, it would have run on every site that allows Optimizely. The wallet address swapping would have worked too, because it never touches the network. A restrictive `connect-src` would still have stopped card details and cookies from leaving the page for a new destination.

Subresource Integrity is not an easy fix here either. An Optimizely snippet changes every time an experiment is published, so pinning it to a fixed hash is not practical. Detecting unexpected changes to trusted scripts needs dedicated script monitoring, which is the gap Report URI's own integrity tooling is designed to fill.

This is not only an Optimizely problem. Report URI also tracked a related wave of injections through other third-party scripts in the days before. Every third-party script on your site is someone else's code running with your site's authority, and your CSP is the control that limits what it can do.

## Availability

Stott Security is free and open source under the MIT licence, and is available for every current flavour of Optimizely CMS:

| Platform | Edition | Status | How to get it |
|-|-|-|-|
| Optimizely CMS 12 | Stott Security version 6 | Available | [NuGet](https://www.nuget.org/packages/Stott.Security.Optimizely) and the [Optimizely NuGet feed](https://nuget.optimizely.com/packages/stott.security.optimizely/) |
| Optimizely CMS 13 | Stott Security version 7 | Available | [NuGet](https://www.nuget.org/packages/Stott.Security.Optimizely) and the [Optimizely NuGet feed](https://nuget.optimizely.com/packages/stott.security.optimizely/) |
| Optimizely SaaS CMS | Stott Security for SaaS | Beta, in review for release | [Request early access](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS/discussions/1) |

The CMS 12 and CMS 13 editions share the same feature set, including Global, Application and Host contexts, per-page sources, internal violation reporting and a full audit trail. Stott Security for SaaS is a complete rebuild as an Optimizely Connect Platform app. It covers CSP sources and directives, keyword sources, report-only mode, external violation reporting and a draft and publish workflow. It currently supports a front end context only. See [Stott Security for Optimizely SaaS CMS](/article/introducing-stott-security-for-saas) for the full feature comparison.

### Other Providers

Stott Security is not the only way to manage a CSP inside Optimizely CMS, and the principles in this article apply whichever tool you use.

[Jhoose Security](https://github.com/andrewmarkham/contentsecuritypolicy) by Andrew Markham is an open-source add-on, licensed under Apache 2.0, that manages Content Security Policy, Permissions Policy and other security headers from an admin interface inside the CMS. It is available from the [Optimizely NuGet feed](https://nuget.optimizely.com/?q=jhoose) and supports CMS 11 and upwards.

## What To Do Now

1. **If you use Optimizely Web Experimentation**, Optimizely have already removed the injected code from affected projects, so the focus now is on the impact. Review which users, API tokens and integrations have write access to your projects, and rotate credentials where needed. Report URI's article also explains how to handle payment cards and cookies that may have been exposed on 16th November.
2. **If you already collect CSP violation reports**, search reports from 16th November for `1688360.cc` and the other indicators listed in Report URI's article.
3. **Review your front-end policy.** Remove `'unsafe-eval'` unless you have decided you need it, decide whether `'strict-dynamic'` is right given what your trusted scripts load, and restrict `connect-src` to destinations you recognise.
4. **Consider configuring nonce**, Optimizely PaaS CMS supports nonce attributes on scripts it injects into the frontend. However, nonce-based execution is not currently supported by the CMS Editor and Admin interfaces, so these requirements need to be handled separately. Google Tag Manager also provides a version of its script that supports nonce propagation to injected scripts.
5. **Separate your Edit and Primary hosts** so that the CMS Editor's relaxations never reach your visitors.
6. **If you have no CSP at all**, start one in report-only mode today. The [Getting Started with Stott Security](/article/getting-started-with-stott-security) guide walks you through it.

## Closing Thoughts

Optimizely have fixed the vulnerability and removed the injected code, but the next compromise could come through a different vendor. Your Content Security Policy is one of the few controls you fully own, and Report URI's data shows that a restrictive one made a real difference here.

My thanks to Report URI for publishing such a thorough investigation. If you would like to suggest a feature or report a bug, head over to the [Stott Security GitHub repository](https://github.com/GeekInTheNorth/Stott.Security.Optimizely), or the [Stott Security for SaaS repository](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS) if you are on SaaS CMS.

## References

- [Report URI - World's Largest Brands Infected With Malware Via Optimizely](https://blog.report-uri.com/worlds-largest-brands-infected-with-malware-via-optimizely/)
- [Optimizely Service Status - Web Experimentation Security Incident](https://status.optimizely.com/incidents/ftw0fh9wx43z)
- [Optimizely Documentation - Update your site's Content Security Policies (CSP)](https://docs.optimizely.com/web-experimentation/docs/update-your-site-s-content-security-policies-csp)
- [MDN - Content-Security-Policy: script-src directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)
- [MDN - Content-Security-Policy: connect-src directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src)
- [Google Tag Platform - Content Security Policy guide](https://developers.google.com/tag-platform/security/guides/csp)