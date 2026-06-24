---
layout: optiaddons
title: "Stott Robots Handler"
description: "Content relating to the Stott Robots Handler Add-on for Optimizely CMS 12 & 13."
permalink: "/article/list/stott-robots-handler"
category: "Stott Robots Handler"
nugetdownloads: "339,000+"
optidownloads: "159,000+"
currentversion: "7.0.0"
gitRepository: "https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler"
---

[Stott Robots Handler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) is an Add-on for [Optimizely](https://www.optimizely.com/) CMS that allows a CMS Administrator to manage robots.txt content, llms.txt content and environment robots meta tag and header overrides without requiring a code deployment.  This Add-on is free to use and is covered by an [MIT License](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler/blob/main/LICENSE.txt).  If you wish to support the ongoing development of this Add-on, then please feel free to [buy me a coffee](https://www.buymeacoffee.com/markstott).

<h2 class="h3 fw-semibold text-dark mb-4">Key Features</h2>
<div class="accordion" id="keyFeaturesAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="robotsHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#robotsAccordion" aria-expanded="false" aria-controls="robotsAccordion">
        🤖 <strong>Robots.txt Management</strong>
      </button>
    </h2>
    <div id="robotsAccordion" class="accordion-collapse collapse" aria-labelledby="robotsHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>User Friendly Interface:</strong> Manage robots.txt content across your whole CMS without a code deployment.</li>
          <li><strong>Per Application &amp; Host:</strong> Define distinct robots.txt content by application (site in CMS 12) and by specific host.</li>
          <li><strong>Smart Resolution:</strong> Requests to <code class="language-plaintext highlighter-rouge">/robots.txt</code> are matched to the correct application by domain, returning sensible default content when none has been configured.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="llmsHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#llmsAccordion" aria-expanded="false" aria-controls="llmsAccordion">
        📄 <strong>LLMS.txt Management</strong>
      </button>
    </h2>
    <div id="llmsAccordion" class="accordion-collapse collapse" aria-labelledby="llmsHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>Familiar Interface:</strong> Manage Markdown llms.txt content in the same interface used for robots.txt, with a larger editor suited to longer files.</li>
          <li><strong>Per Application &amp; Host:</strong> Configure llms.txt by application (site in CMS 12) and specific host, or as an application-wide default.</li>
          <li><strong>Served on Demand:</strong> Content is served on <code class="language-plaintext highlighter-rouge">/llms.txt</code> only when defined — matching a specific host first, then an application default, otherwise returning a 404.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="envHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#envAccordion" aria-expanded="false" aria-controls="envAccordion">
        🔒 <strong>Environment Robots</strong>
      </button>
    </h2>
    <div id="envAccordion" class="accordion-collapse collapse" aria-labelledby="envHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>Protect Lower Environments:</strong> Override robots meta tags and response headers at an environment level to keep integration and preproduction environments out of search engines.</li>
          <li><strong>Global Configuration:</strong> Applied across the whole instance, independent of any application or host configuration.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="opalHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#opalAccordion" aria-expanded="false" aria-controls="opalAccordion">
        🛠️ <strong>Optimizely Opal Tools</strong>
      </button>
    </h2>
    <div id="opalAccordion" class="accordion-collapse collapse" aria-labelledby="opalHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>Conversational Management:</strong> Create and modify robots.txt and llms.txt content directly from Optimizely Opal's chat interface.</li>
          <li><strong>Bearer Token Management:</strong> Issue multiple tokens, each with its own Read or Write scope for robots.txt and llms.txt.</li>
          <li><strong>Self-Describing:</strong> A built-in discovery endpoint registers the available tools with Opal.</li>
          <li><strong>Instruction Friendly:</strong> Pair the tools with Opal Instructions to generate rich llms.txt content tailored to your site.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header mt-0" id="afHeading">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#afAccordion" aria-expanded="false" aria-controls="afAccordion">
        ✨ <strong>Additional Features</strong>
      </button>
    </h2>
    <div id="afAccordion" class="accordion-collapse collapse" aria-labelledby="afHeading" data-bs-parent="#keyFeaturesAccordion">
      <div class="accordion-body">
        <ul>
          <li><strong>Headless Support:</strong> APIs allow robots.txt and llms.txt content to be served and managed within headless solutions.</li>
          <li><strong>No Code Deployment:</strong> All content is managed by CMS administrators with no need for a code deployment.</li>
          <li><strong>Opti Id Ready:</strong> Configurable for use with Optimizely Opti Id.</li>
          <li><strong>CMS 12 &amp; 13:</strong> Supports both Optimizely CMS 12 (Sites) and CMS 13 (Applications).</li>
          <li><strong>Free &amp; Open Source:</strong> Released under the MIT licence.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
