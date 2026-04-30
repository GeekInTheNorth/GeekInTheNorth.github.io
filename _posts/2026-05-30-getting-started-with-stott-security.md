---
layout: post
title: "Getting Started with Stott Security for Optimizely CMS"
description: "A step-by-step getting started guide to installing and configuring the Stott Security add-on for Optimizely CMS, covering NuGet install, service registration, host-level header variation, and your first Content Security Policy."
permalink: "/article/getting-started-with-stott-security"
category:
  - Optimizely
  - "Stott Security"
relatedArticles:
  - "_posts/2026-04-09-stott-security-7.md"
  - "_posts/2025-08-01-optimize-your-csp.md"
  - "_posts/2023-10-08-adding-cors-to-stott-security-add-on.md"
---

[Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) is a free, open-source add-on for Optimizely CMS 12 and CMS 13 that lets you manage Content Security Policy (CSP), Cross-Origin Resource Sharing (CORS), Permissions Policy, response headers and security.txt through a friendly UI inside the CMS.  This article walks through why you might want it, how to install it, the service registration code you need at start up, why running separate hosts for your front-end and CMS backend is worth the effort, and finally how to get your very first Content Security Policy up and running.

## Why Use Stott Security

Security headers are one of those things that everyone agrees are important, but few teams want to redeploy a website every time a marketing tag changes.  Stott Security puts the management of those headers in the hands of CMS administrators, while still giving developers all the hooks they need to keep things tidy in code.

- **No redeploy required.** CMS administrators can add a new analytics domain or tweak a Permissions Policy directive directly in the UI.  Developers don't need to re-run a release pipeline for a header tweak.
- **Layered policies.** Sources for the Content Security Policy can be defined at four levels: Global, Application, Host and Page.  Each level becomes progressively more specific, allowing you to refine policies without weakening your overall security posture.
- **Built-in audit trail.** Every change made through the UI is audited.  Who changed what, when, and what the old and new values were.  This is invaluable when something stops working at midnight on a Friday.
- **Violation reporting.** Stott Security ships with internal reporting endpoints so any browser violations land on a screen inside the CMS, ready to be reviewed and triaged.
- **Import / Export.** Configurations can be exported as JSON and re-imported in another environment.  Promoting a tested CSP from preproduction to production is a single file upload.
- **Headed and headless.** The same module supports traditional headed Optimizely PaaS solutions and headless solutions through a Headers API.
- **Free and open source.** Hosted on [GitHub](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) and published to [nuget.org](https://www.nuget.org/packages/Stott.Security.Optimizely) and [nuget.optimizely.com](https://nuget.optimizely.com/packages/stott.security.optimizely/).

The split is intentional: developers configure the add-on once at start up, and from that point onward your editors and admins can manage the day-to-day header changes without involving the development team.

## Installing the NuGet Package

The package name is `Stott.Security.Optimizely` and it's available on both [nuget.org](https://www.nuget.org/packages/Stott.Security.Optimizely) and the [Optimizely NuGet feed](https://nuget.optimizely.com/packages/stott.security.optimizely/).

Using the .NET CLI:

```
dotnet add package Stott.Security.Optimizely
```

Or from the Visual Studio Package Manager Console:

```
Install-Package Stott.Security.Optimizely
```

Version 7 of the add-on targets **.NET 10** and **Optimizely CMS 13**.  Support for Optimizely CMS 12 continues through the version 5-6 release line, so if you are still on CMS 12 you should pin the appropriate version range.

## Registering the Services

Once the package is installed, two lines bring the module to life, one in your service registration and one in the request pipeline.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddStottSecurity();
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseStottSecurity();

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapContent();
        endpoints.MapControllers();
    });
}
```

There are two pipeline placement rules worth remembering:

- `app.UseStottSecurity()` should be declared **immediately before** `app.UseEndpoints(...)` so that the headers are added to content responses.
- If you are calling `app.UseStaticFiles()`, make sure that call is made **after** `app.UseStottSecurity()`.

For most real solutions you'll want to customise the registration.  The example below sets the connection string, registers a path that should never receive a nonce or hash, sets the audit retention period, and locks the admin UI down to a specific custom role:

```csharp
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
        policy.RequireRole("SecurityAdmins");
    });
});
```

If you are using **Opti ID**, you will need to add the Opti ID authentication scheme to the policy so that authenticated CMS users are recognised by the Stott Security admin UI:

```csharp
services.AddStottSecurity(cspSetupOptions =>
{
    cspSetupOptions.ConnectionStringName = "EPiServerDB";
},
authorizationOptions =>
{
    authorizationOptions.AddPolicy(CspConstants.AuthorizationPolicy, policy =>
    {
        policy.AddAuthenticationSchemes(OptimizelyIdentityDefaults.SchemeName);
        policy.RequireRole("SecurityAdmins");
    });
});
```

By default the admin UI is accessible to users in the **WebAdmins**, **CmsAdmins** or **Administrator** roles.

### In-process or Traditional Razor builds

Stott Security generates the nonce per request and the bundled tag helper writes it onto your `<script>` and `<style>` tags.  Add `@addTagHelper *, Stott.Security.Optimizely` to your `_ViewImports.cshtml`, then mark up your tags with the `nonce` attribute and the helper will populate the value.

```
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, Stott.Security.Optimizely
@addTagHelper *, EPiServer.Cms.AspNetCore.TagHelpers
```

## Why Configure Separate UI and CMS Backend Hosts

Optimizely CMS 13 lets you configure a **Primary** host and an **Edit** host for an application.  The Primary host is what your visitors see; the Edit host is the URL your editors and administrators use to manage content.  This split exists for a reason, and Stott Security version 7 leans into it heavily.

![Hierarchical inheritance of Content Security Policy sources from Global, Application, Host and Page levels](/assets/stott-security-7c.png)

In the Stott Security UI, a Context Switcher lets you target headers (including the entire Content Security Policy) at Global, Application or Host level.  Host is the most specific level, and configuration there overrides anything broader.

![Context Switcher modal for selecting Global, Application or Host context](/assets/stott-security-7b.png)

The CMS backend genuinely needs more permissive headers to function:

- The Optimizely editor uses inline scripts and styles, which means `'unsafe-inline'` is required.
- Some legacy parts of the editor rely on `eval`, which means `'unsafe-eval'` is required.
- The editor pulls in assets from `https://*.optimizely.com`.
- Nonce attributes are not currently supported by the CMS editor and will outright break the UI.

The front-end has none of those constraints.  A modern Optimizely site can run a much tighter CSP — `'self'` for most directives, nonce-driven inline scripts, and a small allowlist of trusted third parties.

If you only have one host then those two sets of requirements have to be combined into a single, more permissive policy.  Splitting them lets the public-facing site stay locked down while the CMS gets only the relaxations it actually needs.  The cost of running an Edit host is small compared to the security uplift on the side of your application that visitors actually see.

## Getting Started With Your First CSP

With the add-on registered and (ideally) a separate Edit host configured, you're ready to set up your first Content Security Policy.  The recommended approach is to start in **Report Only** mode, watch the violations roll in, and only switch to enforcement once the list is clean.

![Stott Security CSP Sources tab showing the source and directive grid](/assets/stott-security-7a.png)

1. Open the Stott Security area in the CMS and pick a context using the Context Switcher.  Start at the **Global** or **Edit host** context.
2. Navigate to **Content Security Policy → Settings**.
3. Toggle **Enable Content Security Policy (CSP)** on.
4. Toggle **Use Report Only Mode** on.  This is critical: it tells the browser to report violations rather than block content, so you can shake out problems without breaking the site.
5. Optionally enable **Use Internal Reporting Endpoints** so violations land on the **CSP Violations** screen for review.
6. Move to the **CSP Sources** tab. The set below is the recommended starting point for the **Global** context as they will be needed everywhere.

| Source | Directives to add | Why it's needed on the Global level |
|-|-|-|
| `'self'` | default-src, child-src, connect-src, font-src, frame-src, img-src, script-src, script-src-elem, style-src, style-src-elem | Same-origin baseline |
| `https://*.optimizely.com` | script-src, script-src-elem, style-src, style-src-elem, connect-src, font-src | Optimizely-hosted assets used by the CMS editor and other Optimizely One products. |

> Both Edit and Primary **Host** contexts inherit from **Application** and then **Global** in that order. Sources defined at a higher level don't need to be re-added at a **Host** level.

7. The following sources are required to keep the **Optimizely CMS editor** working, and they are **not** a recommendation for your public-facing pages.  Add them at the **Edit-host** context level.

| Source | Directives to add | Why it's needed on the Edit host |
|---|---|---|
| `'unsafe-inline'` | script-src, script-src-elem, style-src, style-src-elem | CMS editor uses inline scripts and styles |
| `'unsafe-eval'` | script-src, script-src-elem | CMS editor uses eval |
| `data:` | img-src | CMS editor uses data-URI images |
| `https://*.cloudfront.net/graphik/` | font-src | CMS editor font (Graphik) |
| `https://*.cloudfront.net/lato/` | font-src | CMS editor font (Lato) |

8. For the **Primary** (front-end) host, start from a much tighter baseline.  The minimum sources to configure are:

| Source | Directives to add | Why it's needed on the Primary host |
|-|-|-|
| `'nonce-random'`| script-src, script-src-elem, style-src, style-src-elem | Enables nonce-based execution of script and style elements rendered by your front-end. |

> **Note**: The nonce and use of 'self' at the **Global** level for most directives will ensure your site has a strong secure starting point. This pair gives you a strict, modern CSP where only your own assets and explicitly nonced inline blocks execute.

9. Click **Add Source** for each third-party domain you legitimately need and tick only the directives that apply.
10. Browse the site as both an editor and a visitor.  Watch the **CSP Violations** tab for anything legitimate getting blocked, and add sources as needed.
11. Once the violations list is clean, return to **CSP Settings** and turn **Use Report Only Mode** off to start enforcing the policy.

A couple of golden rules to keep in mind as you work through the source list:

- Keep `default-src` restricted to either `'self'` or `'none'`.  Anything broader weakens every directive that falls back to it.
- Always start in Report Only mode and only enforce once you are confident the right sources have the right directives.

Once your CSP is enforcing cleanly, see [Optimizing Content Security Policies to Stay Within HTTP Header Limits](/article/optimize-your-csp) for techniques to keep it lean as the list of third parties grows.

### If you are using Google Tag Manager

If you use GTM, you should configure GTM to forward the page nonce on to the scripts it injects.  Without this, every tag GTM loads (analytics, pixels, third-party widgets) is treated as an un-nonced script and blocked by your CSP until it is added directly.  The standard approach is to read the nonce from your GTM container snippet and have GTM apply it to its child tags.  See Google's [Custom HTML tag nonce support](https://developers.google.com/tag-platform/tag-manager/web/csp) guidance for the specifics.

If you use the nonce compatible GTM tag, then you will need the following sources in your primary domain:

| Source | Directives to add |
|-|-|
| `'nonce-random'`<br/>(already added in step 8)| script-src, script-src-elem, style-src, style-src-elem |
| `https://www.googletagmanager.com` | connect-src, img-src |
| `https://www.google.com` | connect-src |

If you are not using the nonce compatible GTM tag, then you will need the following sources in your primary domain.  Note that this is a much more permissive CSP.

| Source | Directives to add |
|-|-|
| `'unsafe-inline'`| script-src, script-src-elem |
| `https://www.googletagmanager.com` | connect-src, img-src, script-src, script-src-elem |
| `https://www.google.com` | connect-src |

## Closing Thoughts

That's the full getting-started loop for Stott Security: install the NuGet package, register the services, take advantage of separate Primary and Edit hosts to keep your front-end policy tight without breaking the CMS editor, and bring up your first Content Security Policy in Report Only mode before enforcing it.

Stott Security is a free, open-source add-on for Optimizely CMS 12 and CMS 13, designed from the ground up to be accessible to both technical and non-technical users, with built-in audit functionality to provide clear accountability.  If you'd like to suggest a feature, report a bug, or just see what is coming next, head over to the [Stott Security GitHub repository](https://github.com/GeekInTheNorth/Stott.Security.Optimizely).
