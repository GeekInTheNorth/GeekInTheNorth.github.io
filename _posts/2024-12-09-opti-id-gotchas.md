---
layout: post
title: "Opti ID with Secure Cookies And Third Party AddOns"
description: "How to make sure your cookies and third party addons are properly secured when using Opti ID."
permalink: "/article/opti-id-gotchas"
category:
  - Development
  - Optimizely
---

# Opti ID with Secure Cookies And Third Party AddOns

Published: 9th December 2024

Opti ID has revolutionised access to the Optimizely One suite and is now the preferred authentication method on all PAAS CMS websites that I build.  However there are a couple of gotchas that always need to be taken care, outlined below are the solutions to both.

## Secure Cookies

Any penetration test that you perform on your website will always advise that your cookies are set to be Secure, HTTP Only with a SameSite mode of Strict.  Setting these is simple enough until you realise that the Opti ID cookies are third party and therefore for need a SameSite mode of None.  If you have used Microsoft Entra (Formerly Azure AD) as the authentication method for a CMS, then this problem will be very familiar to you.

The challenge we have is:

- We don't want all cookies to have a SameSite mode of None
- Optimizely cookies are not in our direct control
- Writing verbose custom cookie code everywhere is messy

In the following solution I have used the app.UseCookiePolicy(...) method to set all of the cookies to be Secure, Http Only with a default SameSite mode of None by default.  I then provide a handler for the OnAppendCookie event that will set cookies to use a SameSite mode of Strict provided they do not match one of the following cookie name patterns:

- **oid-** : These are cookies which Opti ID uses for authentication
- **.AspNetCore** : These are cookies NET Core uses for Authentication

```
public static IApplicationBuilder UseSecureCookies(this IApplicationBuilder app)
{
    // Set the default cookie policy
    app.UseCookiePolicy(new CookiePolicyOptions
    {
        HttpOnly = HttpOnlyPolicy.Always,
        Secure = CookieSecurePolicy.Always,
        MinimumSameSitePolicy = SameSiteMode.None,
        OnAppendCookie = context =>
        {
            if (!context.CookieName.StartsWith("oid-") &&
                !context.CookieName.StartsWith(".AspNetCore"))
            {
                // Any cookie that is not an authentication cookie should have a SameSite mode of Strict
                context.CookieOptions.SameSite = SameSiteMode.Strict;
            }
        }
    });

    return app;
}
```

## Configuring AddOns To Use Opti ID

In Optimizely CMS 11, dependency setup relied upon **Initialisation Modules**.  In CMS 12 and .NET core, all of this is now handled in **Startup.cs**. Some commonly used AddOns include a service extension that is intended to be consumed within a startup.cs. Some go as far as to provide a custom authorization policy so that you can customise access to the AddOn to specific roles rather than granting full admin access to the CMS for users who just need that functionality. Here are a few AddOns and the roles that you might want to use:

- Stott Security - CmsAdmins, SecurityAdmins, DataAnalytics
- Stott Robots Handlers - CmsAdmins, SeoAdmins
- Geta NotFound Handler - CmsAdmins, SeoAdmins
- Geta Sitemaps - CmsAdmins, SeoAdmins

Here is the challenge: These modules will not allow you to access them when using Opti Id unless you specify the **Opti ID SchemeName** in the authorizarion policy for each AddOn.

Take this configuration for the **Stott Security AddOn** as an example; this AddOn allows you to segment the data for the AddOn into a separate database and it allows you to define an authorization policy.  In this scenario it is a simple matter of making sure the Opti ID Scheme Name is added to the policy:

```
public static IServiceCollection AddSecurityAddOn(this IServiceCollection services)
{
    services.AddStottSecurity(
        options =>
        {
            options.ConnectionStringName = "EPiServerDB";
        },
        authorization =>
        {
            authorization.AddPolicy(CspConstants.AuthorizationPolicy, policy =>
            {
                // Use the Opti ID scheme Name
                policy.AddAuthenticationSchemes(OptimizelyIdentityDefaults.SchemeName);
                policy.RequireRole(Roles.CmsAdmins, "SecurityAdmins");
            });
        });

    return services;
}
```

## Service Collection Extension Pattern

In both of these examples above, I am following the [Service Collection Extension Pattern](https://dotnetfullstackdev.medium.com/service-collection-extension-pattern-in-net-core-with-item-services-6db8cf9dcfd6).  I highly recomment this pattern as it allows you to modularise your configuration code and to keep your startup.cs clean and easy to understand or rearrange.  
