---
layout: post
title: "Response Header Limits and Content Security Policies"
description: "Issues with response header size limits and how to optimize a larger content security policy."
permalink: "/article/response-header-limits-and-csps"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2025-04-08-stott-security-3-x.md"
---

# Response Header Limits and Content Security Policies

Published 1st August 2025

As the Stott Security module is getting more widely used across multiple Optimizely CMS solutions, I am starting to see a wider variety of content security policies that have been surprising. 

This year I have had two queries from consumers where they encountered issues with the website not responding.  After some investigation, I was able to determine that this issue was actually caused by Cloudflare's restrictions on response headers that are [documented here](https://developers.cloudflare.com/workers/platform/limits/#response-limits).  Cloudflare will drop any response where the combined response headers exceed 32kb or where the combined header size for a unique header name exceeds 16kb. When triaging the issue, the logs showed that the webserver had successfully served the response. Meanwhile in the browser the user was left with a pending web response.  In these cases I was able to review the Content Security Policy for each client, both of which had over 220-250 sources.  In both cases I was able to optimize their CSP and reduce the overall size by 30% to 50%.

In this article I will cover gotchas and techniques to reduce bloating within your content security policy based on these experiences.

## How To Simplify Your CSP

### 1. Simplify the directives being used

In CSP3, the ability to split `script-src` into `script-src-elem` and `script-src-attr` was added.  This was intended to give more control over what could be used in a `<script>` element vs what could be used in a JavaScript attribute on an element.  There was a period of time where if you wanted to use `script-src-elem` and `script-src-attr` you still had to produce `script-src` to support devices and browsers that were not yet CSP 3 compliant.  CSP 3 support is now very broad so you can omit `script-src`.  If you still have a lot of sources and there is an overlap of sources for `script-src-elem` and `script-src-attr` then you could switch back to using `script-src` instead.

**Larger and very specific:**
```csp
script-src-elem 'self' 'nonce-r4nd0m' https://www.example.com https://www.elem-only.com;
script-src-attr 'self' https://www.example.com https://www.attr-only.com;
```

**Smaller but less specific:**
```csp
script-src 'self' 'nonce-r4nd0m' https://www.example.com https://www.elem-only.com https://www.attr-only.com;
```

Please note that the same technique can be used for `style-src`, `style-src-elem` and `style-src-attr`.

### 2. Keep `default-src` simple

The `default-src` directive is meant to be the primary fallback for most directives.  If a specific directive has not been specified, then this will used instead.  My recommendation is to keep `default-src`  as simple as possible, either denying access by default or limiting it to just your own domain.

- `default-src 'self';` : this will ensure that only the current domain is allowed to perform actions against itself where a more specific directive is absent.
- `default-src 'none';` : this will deny permissions where a more specific directive is not defined.
- `default-src 'self' https://*.mydomain.com;` : this will ensure that only the current domain (or it's subdomains) are allowed to perform actions on the site in the absence of a more specific directive.

### 3. Keep `base-uri` simple

The `<base>` element defines the domain to be used for all relative links on the page.  The purpose of the `base-uri` directive is to restrict which domains can be used in this element.  Without this being included in your Content Security Policy, a malicious actor could overwrite the `<base>` element and direct your user's traffic to their own domain instead.

Given how limited this is, this directive should be limited to either of the following options:

```csp
base-uri 'self';

or

base-uri 'self' https://*.mydomain.com;.
```

### 4. Keep `frame-ancestors` simple

The purpose of `frame-ancestors` is to restrict which websites can host your CMS site in an iframe.  For most Optimizely websites, this should be limited to allowing only the website to frame itself:

```csp
frame-ancestors 'self';

or

frame-ancestors 'self'; https://*.mydomain.com;
```

If you are using Optimizely Web Experimentation then you will also want to allow optimizely.com in order to allow the edit variant interface to work:

```csp
frame-ancestors 'self'; https://*.mydomain.com https://*.optimizely.com;
```

### 5. Avoid duplicate entries in your CSP

In the example CSPs that I reviewed, I noted that there were multiple instances of the same domain being added twice.  Both with a trailing slash and without it like so:

```csp
script-src 'self' https://www.example.com https://www.example.com/
```

In a CSP, these two forms are functionally identical. The trailing slash has **no effect** when the source is just a host (i.e. no path). Browsers treat both as allowing all content from the origin `https://www.example.com`.

**Simplify your policy** by removing duplicates and keeping only one clean version:

```csp
script-src 'self' https://www.example.com
```

**Note:** If you're using a CSP source that includes a **path**, then the trailing slash *does* matter and it will limit resources to just those immediately below the path.
For example:

- `https://example.com/js/` matches `/js/app.js`
- `https://example.com/js` matches only `/js`

### 6. Check if wildcard subdomains already cover more specific domains

In the example CSPs that I reviewed, I noted that there were multiple instances of redundant wildcard entries across closely related domains. For example, I came across policies that included:

```csp
script-src https://*.consentmanager.net https://*.delivery.consentmanager.net

or

script-src https://*.fls.doubleclick.net https://*.g.doubleclick.net https://*.doubleclick.net
```

When using a wildcard source like `https://*.example.com`, it's important to understand how wildcards behave:

- `https://*.example.com` matches any number of subdomain levels, such as `cdn.sub.example.com`
- It does **not** match the apex domain itself (i.e. `https://example.com`)

This means broader wildcard entries may already cover the more specific ones — and keeping both adds unnecessary bloat.

#### Before and After

| Previous Entries | Optimized Entry |
|-|-|
| `https://*.consentmanager.net`<br>`https://*.delivery.consentmanager.net` | `https://*.consentmanager.net` |
| `http://*.fls.doubleclick.net`<br>`https://*.g.doubleclick.net`<br>`https://*.doubleclick.net` | `https://*.doubleclick.net`    |

In these examples, I reviewed which domains were actually used by the site and selected the most permissive wildcard that safely covered them.

**Note:** Always verify that the broader wildcard covers all required sources and doesn't introduce unwanted access. If the root domain (e.g. `https://doubleclick.net`) is needed, it must still be listed separately — it is not included in a wildcard like `*.doubleclick.net`.

### 7. Be Cautious with `https:` in Source Directives

On large, multinational CMS platforms (especially those where editors frequently embed third-party content like donation forms, interactive widgets, or 360° views) Content Security Policies can become hard to maintain. In these cases, it's tempting to use a broad directive like:

```csp
frame-src 'self' https:;
```

This allows any content to be iframed as long as it's served over HTTPS, which can be a **pragmatic short-term solution** when content sources are constantly changing and difficult to manage. However, this convenience comes with serious trade-offs.

Using `https:` effectively tells the browser to allow **any** secure domain and not just trusted partners. That means explicitly listing a domain like `https://example.com` is redundant, and worse, it also implicitly permits `https://malicious.site` or any other HTTPS-based domain to load scripts or frames on your site:

```csp
script-src 'self' https: https://example.com;  // Redundant and risky
```

**Recommendation:** While `https:` might seem like a helpful shortcut, it's generally better to define a specific **allowlist** of trusted domains. Avoid `https:` as a standalone source and instead use fully qualified entries like `https://trustedpartner.com` to maintain control and minimize your exposure to third-party threats.

### 8. Audit Your Content Security Policy

Optimizely have previous stated that most websites go through an average lifespan of 5 years between rebuilds or rebrands.  Over the lifespan of the website, many different tools will have been injected into the site by tools such as Google Tag Manager.  You will have had to update your Content Security Policy to allow these third party tools to work on your brand site.

Did you stop using a specific user engagement measurement tool that was injected by GTM? Did you remember to remove it from your Content Security Policy?

Stott Security has an Import / Export feature which will allow you to export all of your security headers as well as a built in reporting function that can help you in identifying defunct sources in your Content Security Policy.

1. Go to the Stott Security Interface
2. On the Tools page, export your current configuration
3. On the CSP Settings Page, turn on "Use Report Only Mode" and "Use Internal Reporting Endpoints"
4. Start removing sources you think may be defunct
5. Check the CSP Violations page to see if a violation is raised for this source.

If you're not comfortable with your changes, you can go back into the Tools menu and reimport your original configuration.  If you're happy with your changes, then you can deactivate "Use Report Only Mode" and "Use Internal Reporting Endpoints".

### 9. Use Page Specific Extensions of the Source List

Stott Security has long supported the ability to extend the sources for a Content Security Policy for a specific page.  Lets say you do have a website with lots of embedded content and most of this is fairly unique.  You can end up bloating your CSP just trying to keep up with the number of embeds.  This can be undesirabe because you will end up allowing a domain to act on **all** of your website when it is only required on a single page.

To implement this, your development team or agency partner can implement the `IContentSecurityPolicyPage` interface either as a CMS editable property or by using code you implement yourself as follows:

```c#
public class MyPage : PageData, IContentSecurityPolicyPage
{
    [Display(
        Name = "Content Security Policy Sources",
        Description = "The following Content Security Policy Sources will be merged into the global Content Security Policy when visiting this page",
        GroupName = "Security",
        Order = 10)]
    [EditorDescriptor(EditorDescriptorType = typeof(CspSourceMappingEditorDescriptor))]
    public virtual IList<PageCspSourceMapping> ContentSecurityPolicySources { get; set; }
}

or

public class MyPage : PageData, IContentSecurityPolicyPage
{
    public IList<PageCspSourceMapping> ContentSecurityPolicySources => this.GetSourceListForPage();
}
```

When this page is served, the sources and directives specified here are merged into the global content security policy just for the purposes of serving this page.

## Changes to Stott Security for Optimizely CMS 12

In order to prevent other cusumers of Stott Security from encountering the same issue with header size limits, I decided that I would add some safety nets for the generated Content Security Policy that would respect Cloudflare's hard 16KB limit. When researching header size limits in general, I observed that the most common recommendation was to keep your headers below 8KB per header to ensure broad compatability. 

Starting in version 3.0.2 of Stott Security, CSPs are now intelligently split into [multiple CSP Headers](https://content-security-policy.com/examples/multiple-csp-headers/) if their size approaches the 8KB limit. Since browsers enforce the most restrictive policy among multiple CSP headers, these headers are carefully divided based on directive hierarchy and fallback behavior.

If a header grows beyond 12KB, additional logic is applied to consolidate directives as follows:

- `script-src-elem` and `script-src-attr` are merged into `script-src`.
- `style-src-elem` and `style-src-attr` are merged into `style-src`.
- `frame-src` and `worker-src` are merged into `child-src`.
- Any omitted directives falling back to `default-src` are added explicitly, defaulting to `'self'` if needed.

As a final safeguard, if the combined size of all CSP headers approaches the 16KB Cloudflare limit, the CSP will not be generated to avoid unexpected failures.

## Summary

In order to simplify your CSP and keep it below the recommend 8KB or Cloudflare's hard 16KB limit consider the following:

- Simplify Directive Use
  - Use just `script-src` instead of `script-src`, `script-src-elem` and `script-src-attr`
  - Use just `style-src` instead of `style-src`, `style-src-elem` and `style-src-attr`
- Keep `default-src` simple by restricting it just to `'self'`
- Keep `base-uri` simple by restricting it just to `'self'`
- Keep `frame-ancestors` simple by restricting it just to `'self'`
- Avoid duplicate entries such as `https://www.example.com` and `https://www.example.com/`
- Avoid using less specific wildcards (`https://*.one.example.com`) if there is already a more permissive wildcard (`https://*.example.com`).
- Consider the use of `https:` very carefully as it allows **all** domains.
- Audit your Content Security Policy and remove permissions for scripts you are no longer using.
- Consider using the page specific extension of the Content Security Policy feature that is part of Stott Security
- Consider updating to the latest version of Stott Security today in order to benefit from automatic CSP simplification and to protect your servers from bloated content security policies.