---
layout: optiaddons
title: "Stott Security"
description: "Content relating to the Stott Security Add-On for Optimizely CMS 12, the leading security header manager."
permalink: "/article/list/stott-security"
category: "Stott Security"
nugetdownloads: "71,800+"
optidownloads: "34,000+"
currentversion: "3.2.1"
gitRepository: "https://github.com/GeekInTheNorth/Stott.Security.Optimizely"
---

[Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) is an Add-on for [Optimizely](https://www.optimizely.com/) CMS that allows a CMS Administrator to manage security headers that are used to protect the CMS website without requiring a code deployment.  This Add-on is free to use and is covered by an [MIT License](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/blob/main/LICENSE.txt).  If you wish to support the ongoing development of this Add-on, then please click on the [ko-fi](https://ko-fi.com/V7V0RX2BQ) button below to donate or buy me a coffee.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V0RX2BQ)

## Key Features

### 🛡️ Content Security Policy

- **User Friendly Interface:** Manage individual domains and what permissions you grant them on a domain by domain basis.
- **Searchable:** Search by domain or filter by permission to fully understand what permissions have been granted.
- **Reporting:** Supporting internal and external reporting endpoints, understand violations either directly within the add-on or in a third party service.
- **Violation Handling:** Add blocked domains straight into your CSP straight from the violation report screen
- **Agency Allow List:** Automatically update your Content Security Policies across multiple instances based on a centrally managed allow list.
- **Supports Nonce:** Supports nonce attributes on script and style tags. Automatically applied for traditional CMS pages, must be applied in UI code for Headless solutions.

### 🔐 Permission Policy

- **User Friendly Interface:** Manage individual directives in an easy-to-use interface.
- **Searchable:** Search by domain or filter by permission to fully understand what permissions have been granted.

### 🌐 Cross Origin Resource Sharing (CORS)

- **CORS Support:** Manage the domains that are allows to make CORS requests into your website.
- **Native:** Hooks into the Microsoft's built in .NET CORS middleware to protect your CMS with minimal effort.
- **Optimizely Headers:** Quickly add known Optimizely headers for the Content Delivery and Definition APIs at the click of a button.

### 📋 Response Headers

- **User Friendly Interface:** Manage all of your classic response headers in a nice easy to manage interface.
- **Supported Headers:**
  - `Cross-Origin-Embedder-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
  - `X-Content-Type-Options`
  - `X-XSS-Protection`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Strict-Transport-Security` (HSTS)

### 📄 Security.txt

- **User Friendly Interface:** Manage your security.txt files in an easy to interface that is familiar to users of Stott Robots Handler.
- **Multi-Domain / Host Support:** Write a single security.txt file for your entire CMS, or create them by site or even specific host. 

### ✨ Additional Features

- **Previews:** A preview screen that will show you your complete collection of compiled headers.
- **Headless Support:** APIs can be consumed by your headless solution to serve headers using middleware in well known headless providers.
- **Import/Export:** Export all your settings to back them up before making sweeping changes and import them to roll them back to a known state.
- **Fully Audited:** All changes made within the add-on are audited complete with field value changes.
- **Audit Reporting:** Review all changes made to settings by user, date or record type.
- **Validation:** Client side and server side validation with visual feedback to prevent configuration errors