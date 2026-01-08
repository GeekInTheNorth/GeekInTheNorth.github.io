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

<h2 class="h3 fw-semibold text-dark mb-4">Key Features</h2>
<div class="accordion" id="keyFeaturesAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="cspHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cspAccordion" aria-expanded="true" aria-controls="cspAccordion">
        🛡️ <strong>Content Security Policy</strong>
      </button>
    </h2>
    <div id="cspAccordion" class="accordion-collapse collapse" aria-labelledby="cspHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>User Friendly Interface:</strong> Manage individual domains and what permissions you grant them on a domain by domain basis.</li>
          <li><strong>Searchable:</strong> Search by domain or filter by permission to fully understand what permissions have been granted.</li>
          <li><strong>Reporting:</strong> Supporting internal and external reporting endpoints, understand violations either directly within the add-on or in a third party service.</li>
          <li><strong>Violation Handling:</strong> Add blocked domains straight into your CSP straight from the violation report screen</li>
          <li><strong>Agency Allow List:</strong> Automatically update your Content Security Policies across multiple instances based on a centrally managed allow list.</li>
          <li><strong>Supports Nonce:</strong> Supports nonce attributes on script and style tags. Automatically applied for traditional CMS pages, must be applied in UI code for Headless solutions.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="ppHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#ppAccordion" aria-expanded="false" aria-controls="ppAccordion">
        🔐 <strong>Permission Policy</strong>
      </button>
    </h2>
    <div id="ppAccordion" class="accordion-collapse collapse" aria-labelledby="ppHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>User Friendly Interface:</strong> Manage individual directives in an easy-to-use interface.</li>
          <li><strong>Searchable:</strong> Search by domain or filter by permission to fully understand what permissions have been granted.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="corsHeader">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#corsAccordion" aria-expanded="false" aria-controls="corsAccordion">🌐 <strong>Cross Origin Resource Sharing (CORS)</strong></button>
    </h2>
    <div id="corsAccordion" class="accordion-collapse collapse" aria-labelledby="corsHeader" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>CORS Support:</strong> Manage the domains that are allows to make CORS requests into your website.</li>
          <li><strong>Native:</strong> Hooks into the Microsoft’s built in .NET CORS middleware to protect your CMS with minimal effort.</li>
          <li><strong>Optimizely Headers:</strong> Quickly add known Optimizely headers for the Content Delivery and Definition APIs at the click of a button.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="rhHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rhAccordion" aria-expanded="true" aria-controls="rhAccordion">📋 <strong>Response Headers</strong></button>
    </h2>
    <div id="rhAccordion" class="accordion-collapse collapse" aria-labelledby="rhHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>User Friendly Interface:</strong> Manage all of your classic response headers in a nice easy to manage interface.</li>
          <li><strong>Supported Headers:</strong>
            <ul>
              <li><code class="language-plaintext highlighter-rouge">Cross-Origin-Embedder-Policy</code></li>
              <li><code class="language-plaintext highlighter-rouge">Cross-Origin-Opener-Policy</code></li>
              <li><code class="language-plaintext highlighter-rouge">Cross-Origin-Resource-Policy</code></li>
              <li><code class="language-plaintext highlighter-rouge">X-Content-Type-Options</code></li>
              <li><code class="language-plaintext highlighter-rouge">X-XSS-Protection</code></li>
              <li><code class="language-plaintext highlighter-rouge">X-Frame-Options</code></li>
              <li><code class="language-plaintext highlighter-rouge">Referrer-Policy</code></li>
              <li><code class="language-plaintext highlighter-rouge">Strict-Transport-Security</code> (HSTS)</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="stHeader">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#stAccordion" aria-expanded="false" aria-controls="stAccordion">📄 <strong>Security.txt</strong></button>
    </h2>
    <div id="stAccordion" class="accordion-collapse collapse" aria-labelledby="stHeader" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <p><strong>Coming in version 4!</strong></p>
        <ul>
          <li><strong>User Friendly Interface:</strong> Manage your security.txt files in an easy to interface that is familiar to users of Stott Robots Handler.</li>
          <li><strong>Multi-Domain / Host Support:</strong> Write a single security.txt file for your entire CMS, or create them by site or even specific host.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="afHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#afAccordion" aria-expanded="false" aria-controls="#afAccordion">✨ <strong>Additional Features</strong></button>
    </h2>
    <div id="afAccordion" class="accordion-collapse collapse" aria-labelledby="afHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>Previews:</strong> A preview screen that will show you your complete collection of compiled headers.</li>
          <li><strong>Headless Support:</strong> APIs can be consumed by your headless solution to serve headers using middleware in well known headless providers.</li>
          <li><strong>Import/Export:</strong> Export all your settings to back them up before making sweeping changes and import them to roll them back to a known state.</li>
          <li><strong>Fully Audited:</strong> All changes made within the add-on are audited complete with field value changes.</li>
          <li><strong>Audit Reporting:</strong> Review all changes made to settings by user, date or record type.</li>
          <li><strong>Validation:</strong> Client side and server side validation with visual feedback to prevent configuration errors</li>
        </ul>
      </div>
    </div>
  </div>
</div>
