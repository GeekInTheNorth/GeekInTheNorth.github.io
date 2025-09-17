---
layout: post
title: "Secure Headers in .NET 5.0"
description: "Removing information leaking headers and adding security headers in a .NET 5.0 web application using IIS."
permalink: "/article/secure_headers_in__net_5_0"
category:
  - Development
  - Security
---

# Secure Headers in .NET 5.0

<i class="fa-solid fa-calendar me-2"></i>Published: 19th October 2021

I have been building .NET 5.0 websites for personal projects as well as reviewing the move from .NET 4.8 to .NET 5.0 by Optimizely and seeing the evolution of the CMS solution.  In any website build it is best practice to remove any headers that your website may produce which expose the underlying technology stack and version.  This is known as information leakage and provides malicious actors with information that allows them to understand the security flaws in the hosting technologies utilized by your website.  It is also best practice to provide headers which instruct the user's browser as to how your website can use third parties and be used by third parties in order to offer the best protection for the user.

.NET 5.0 and .NET Core 3.1 follow a common pattern in how you build websites.  Web.config is meant to be a thing of the past with configuration of the site moving to appsettings.json and code.  A good place to add security headers to your requests is to create a security header middleware:

```
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MyProject.Feature.Security
{

    public class SecurityHeaderMiddleware
    {
       private readonly RequestDelegate _next;

        public SecurityHeaderMiddleware(RequestDelegate next)
        {
           _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
           // Add headers to instruct browser behaviour.
           context.Response.Headers.Add("X-Frame-Options", "DENY");
           context.Response.Headers.Add("X-Xss-Protection", "1; mode=block");
           context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
           context.Response.Headers.Add("Referrer-Policy", "no-referrer");
           context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; frame-src 'self' https://www.youtube-nocookie.com/;");

            await _next.Invoke(context);
        }
   }
}
```

This middleware can then be added to the configure method of your startup class like so:

```
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
   app.UseMiddleware<SecurityHeaderMiddleware>();
}
```

I did find that I couldn't remove the server and x-powered-by headers using this method regardless of whether these headers were removed before or after the _next.Invoke(context) call or whether the middleware was declared first or last.  As it turns out, these are added by the hosting technology, in this case IIS.  The only way to remove these headers was to add a minimal web.config file to the web solution that contained just enough configuration to remove these headers.

```
<?xml version="1.0" encoding="utf-8"?>
<configuration>
   <system.webServer>
       <httpProtocol>
           <customHeaders>
               <remove name="X-Powered-By" />
           </customHeaders>
       </httpProtocol>
       <security>
           <requestFiltering removeServerHeader="true" />
       </security>
   </system.webServer>
</configuration>
```

I spent a good while looking for this solution, almost every solution I could find was based on hosting within Kestrel rather than IIS.  If you are hosting with Kestrel, then you can remove the server header by updating your CreateHostBuilder method in program.cs to set the options for Kestrel to exclude the server header.

```
public static IHostBuilder CreateHostBuilder(string[] args, bool isDevelopment)
{
   return Host.CreateDefaultBuilder(args)
              .ConfigureCmsDefaults()
              .ConfigureWebHostDefaults(webBuilder =>
              {
                  webBuilder.UseStartup<Startup>();
                  webBuilder.UseKestrel(options => { options.AddServerHeader = false; });
              });
}
```

## Alternate Libraries

Now if you don't want to build a custom middleware component and you'd like a simple fluent language to building content security policies, then you can install the NWebsec.AspNetCore.Middleware NuGet package.  This provides a collection of middleware and extensions which cover each of the security header requirements.

```
app.UseXContentTypeOptions();
app.UseXXssProtection(opt => opt.EnabledWithBlockMode());
app.UseXfo(opt => opt.SameOrigin());
app.UseReferrerPolicy(opt => opt.NoReferrerWhenDowngrade());
app.UseCsp(opt => opt.DefaultSources(s => s.Self())
                    .ScriptSources(s => s.Self().UnsafeInline().UnsafeEval().CustomSources("https://ajax.aspnetcdn.com", "https://cdn.jsdelivr.net", "https://unpkg.com/vue@2.6.12/dist/vue.js"))
                    .StyleSources(s => s.Self().UnsafeInline())
                    .ConnectSources(s => s.Self().CustomSources("https://allinskatechallengefunctions.azurewebsites.net"))
                    .FrameSources(s => s.None())
                    .FrameAncestors(s => s.None())
                    .ImageSources(s => s.Self().CustomSources("data:", "https:", "https://www.gravatar.com")));
```