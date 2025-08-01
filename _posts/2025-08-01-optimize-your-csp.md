---
layout: post
title: "Optimizing Content Security Policies to Stay Within HTTP Header Limits"
description: "Discover how to audit, reduce, and optimize Content Security Policies. Helping you stay within browser and CDN header size limits."
permalink: "/article/optimize-your-csp"
category:
  - Development
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2025-04-08-stott-security-3-x.md"
---

# Optimizing Content Security Policies to Stay Within HTTP Header Limits

Published 1st August 2025

As the Stott Security module continues to gain traction across a growing number of Optimizely CMS solutions, I’ve encountered a broader and often more complex range of Content Security Policies (CSPs). Earlier this year, two separate clients reported that their websites were not responding as intended. After investigation, the root cause wasn’t the application server, it was **Cloudflare silently dropping the response** due to excessive header size.

In both cases, the Content Security Policy (CSP) contained between 220–250 domain entries. After reviewing and optimizing their policies, I was able to resolve the issue by reducing the size of the CSP by 30–50%. In this article, I’ll share common CSP pitfalls and practical techniques to shrink the size of your Content Security Policy, helping you avoid silent failures and stay within browser and CDN limits.

> **Please note** Cloudflare will drop any HTTP response where the combined headers exceed 32KB or a single header exceeds 16KB.  
> — [Cloudflare Docs](https://developers.cloudflare.com/workers/platform/limits/#request-limits)

## 1. Simplify the directives being used

In CSP 3, the ability to split `script-src` into `script-src-elem` and `script-src-attr` was added.  This was intended to give more control over what could be used in a `<script>` element vs what could be used in a JavaScript attribute on an element.  There was a period of time where if you wanted to use `script-src-elem` and `script-src-attr` you still had to produce `script-src` to support devices and browsers that were not yet CSP 3 compliant.  CSP 3 support is now very broad so you can omit `script-src`.  If you still have a lot of sources and there is an overlap of sources for `script-src-elem` and `script-src-attr` then you could switch back to using `script-src` instead.

**Larger and very specific:**
```csp
script-src-elem 'self' 'nonce-r4nd0m' https://www.example.com https://www.elem-only.com;
script-src-attr 'self' https://www.example.com https://www.attr-only.com;
```

**Smaller but less specific:**
```csp
script-src 'self' 'nonce-r4nd0m' https://www.example.com https://www.elem-only.com https://www.attr-only.com;
```

> 💡 **Tip:** the same technique can be used for `style-src`, `style-src-elem` and `style-src-attr`.

## 2. Keep default-src simple

The `default-src` directive serves as a fallback for most other Content Security Policy directives. If a directive like `script-src` or `img-src` isn't explicitly defined, the browser will fall back to whatever you've set in `default-src`. To reduce complexity and prevent overly permissive defaults, it's best to keep `default-src` as tight as possible. Ideally restricted to your own domain or even disabled altogether.

Here are three practical options:

- `default-src 'none';` Blocks all resources unless explicitly allowed by another directive. This is the most restrictive and secure default.
- `default-src 'self';` Allows only resources from the current domain. This is a common and safe choice for many sites.
- `default-src 'self' https://*.mydomain.com;` Slightly more permissive—this allows resources from your domain and all subdomains. Be cautious: this could include dev, test, or legacy subdomains unless you scope them intentionally.

>💡**Tip:** If you're already specifying individual directives like `script-src`, `style-src`, and `img-src`, you may not need a permissive `default-src` at all. In that case, consider using `'none'` to avoid accidentally allowing fallback behaviors you didn’t intend.

## 3. Keep base-uri simple

The `<base>` HTML element defines the base URL for all relative links on a page. The `base-uri` directive in your Content Security Policy restricts which domains are allowed to be set in this element.

Without this restriction, a malicious actor could modify the `<base>` element to redirect your users’ traffic to an attacker-controlled domain. For example, an attacker could inject a `<base href="https://malicious.site/">` tag, causing all relative links on your page to resolve to the malicious site. This can lead to phishing attacks, misleading users into submitting sensitive information or downloading harmful content.

Because this directive serves a very specific purpose, it’s best to keep it narrowly scoped, typically to one of the following:

```csp
base-uri 'self';

or

base-uri 'self' https://*.mydomain.com;
```

## 4. Keep frame-ancestors simple

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

## 5. Avoid duplicate entries

In the Content Security Policies that I reviewed, I noted that there were multiple instances of the same domain being added twice.  Both with and without a trailing slash like so:

```csp
script-src 'self' https://www.example.com https://www.example.com/
```

In a Content Security Policy, these two forms are functionally identical. The trailing slash has **no effect** when the source is just a host (i.e. no path). Browsers treat both as allowing all content from the origin `https://www.example.com`.

**Simplify your policy** by removing duplicates and keeping only one clean version:

```csp
script-src 'self' https://www.example.com
```

>💡 **Tip:** If you're using a CSP source that includes a **path**, then the trailing slash *does* matter and it will limit resources to just those immediately below the path:
> - `https://example.com/js/` matches `/js/app.js`
> - `https://example.com/js` matches only `/js`

## 6. Check if wildcard subdomains already cover more specific domains

In the reported examples, I found multiple instances of redundant wildcard entries for closely related domains. These examples included:

```csp
script-src https://*.consentmanager.net https://*.delivery.consentmanager.net https://*.fls.doubleclick.net https://*.g.doubleclick.net https://*.doubleclick.net
```

When using a wildcard source like `https://*.example.com`, it's important to understand how wildcards behave:

- `https://*.example.com` matches any number of subdomain levels, such as `cdn.sub.example.com`
- It does **not** match the apex domain itself (i.e. `https://example.com`)

Knowing this, we can simplify the content security policy to:

```csp
script-src https://*.consentmanager.net https://*.doubleclick.net;
```
>💡 **Tip:** Always verify that the broader wildcard covers all required sources and doesn't introduce unwanted access. If the root domain (e.g. `https://doubleclick.net`) is needed, it must still be listed separately. It is not included in a wildcard like `*.doubleclick.net`.

## 7. Be cautious with https: in source directives

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

## 8. Audit Your Content Security Policy

Optimizely have previously noted that most websites go an average of five years between rebuilds or rebrands. Over that time, it's common for third-party tools to be added and removed—often through platforms like Google Tag Manager (GTM). Each time a tool is introduced, it typically requires updates to your Content Security Policy to allow scripts, iframes, or connections from new domains.

But what happens when you stop using one of those tools?

It's easy to forget to remove those permissions from your Content Security Policy. Over time, this results in bloated, outdated, and potentially less secure policies.

The [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) module includes features that make auditing easier:

1. Navigate to the **Stott Security Interface**
2. On the **Tools** page, export your current security configuration
3. On the **CSP Settings** page:
   * Enable **"Use Report-Only Mode"**
   * Enable **"Use Internal Reporting Endpoints"**
4. Begin removing CSP sources you believe may no longer be in use
5. Monitor the **CSP Violations** page to confirm whether any legitimate content breaks

If any issues arise, you can simply re-import your saved configuration from the Tools page. Once you're confident that your updated policy is safe, turn off **"Use Report-Only Mode"** and **"Use Internal Reporting Endpoints"** to enforce the streamlined policy.

## 9. Use page specific extensions of the source list

[Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) has long supported the ability to extend the sources for a Content Security Policy for a specific page.  Lets say you do have a website with lots of embedded content and most of this is fairly unique.  You can end up bloating your CSP just trying to keep up with the number of embeds.  This can be undesirable because you will end up allowing a domain to act on **all** of your website when it is only required on a single page.

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

In order to prevent other cusumers of [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) from encountering the same issue with header size limits, I decided that I would add some safety nets for the generated Content Security Policy that would respect Cloudflare's hard 16KB limit. When researching header size limits in general, I observed that the most common recommendation was to keep your headers below 8KB per header to ensure broad compatability. 

Starting in version 3.0.2 of [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely), CSPs are now intelligently split into [multiple CSP Headers](https://content-security-policy.com/examples/multiple-csp-headers/) if their size approaches the 8KB limit. Since browsers enforce the most restrictive policy among multiple CSP headers, these headers are carefully divided based on directive hierarchy and fallback behavior.

If a header grows beyond 12KB, additional logic is applied to consolidate directives as follows:

- `script-src-elem` and `script-src-attr` are merged into `script-src`.
- `style-src-elem` and `style-src-attr` are merged into `style-src`.
- `frame-src` and `worker-src` are merged into `child-src`.
- Any omitted directives falling back to `default-src` are added explicitly, defaulting to `'self'` if needed.

As a final safeguard, if the combined size of all CSP headers approaches the 16KB Cloudflare limit, the CSP will not be generated to avoid unexpected failures.

## Summary

In order to simplify your Content Security Policy and keep it below the recommend 8KB or Cloudflare's hard 16KB limit consider the following:

- Simplify Directive Use
  - Use just `script-src` instead of `script-src`, `script-src-elem` and `script-src-attr`
  - Use just `style-src` instead of `style-src`, `style-src-elem` and `style-src-attr`
- Keep `default-src`, `base-uri` and `frame-ancestors` simple by restricting them just to `'self'`
- Avoid duplicate entries such as `https://www.example.com` and `https://www.example.com/`
- Avoid using less specific wildcards (`https://*.one.example.com`) if there is already a more permissive wildcard (`https://*.example.com`).
- Consider the use of `https:` very carefully as it allows **all** domains.
- Audit your Content Security Policy and remove permissions for scripts you are no longer using.
- Consider using the page specific extension of the Content Security Policy feature that is part of [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely)
- Consider updating to the latest version of [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) today in order to benefit from automatic CSP simplification and to protect your servers from bloated content security policies.