---
layout: post
title: "Stott Security Version 2 So Far"
description: "A summary of all new functionality and changes that have been introduced to the Stott Security module so far."
permalink: "/article/stott-security-2-x"
category:
  - Development
  - Optimizely
  - "Stott Security"
---

# Stott Security Version 2 So Far

In December 2023, I unveiled the initial version of Stott Security version 2. Although I typically announce each version I release, these announcements have often been concise, lacking in-depth explanations. Let's delve into that now.

## Cross-Origin Resource Sharing Headers

Cross-Origin Resource Sharing (CORS) headers serve as your web server's means of specifying which domains, other than its own, are permitted to access its APIs. If you aim to bolster your website's security, implementing both CORS and CSP is advisable, as they safeguard your website from different angles.  The UI for managing CORS within Stott Security can be seen below:

![CORS Tab in Stott Security](/assets/StottSecurityCorsUi.png)

Interestingly, integrating a CMS-editable CORS policy turned out to be simpler than anticipated. In the .NET Core framework, there exists a default implementation of the **ICorsPolicyProvider** interface, which is automatically injected unless a custom implementation is provided. Leveraging this, my implementation extends the default provider and its interface. Upon a request, if a specific policy has been applied to the route, it's loaded using the default implementation. Conversely, when no policy name is specified, the CORS policy defined by the module is loaded. The invocation of the custom implementation adheres to the standard protocol within .NET Core.

For further insights into the original CORS implementation within Stott Security, refer to [Adding CORS Management to Optimizely CMS 12](/article/adding-cors-to-stott-security-add-on). Notably, this functionality has been updated to accommodate both fixed CORS policies in the code and the globally utilized policy by Stott Security.

## Improved Source and Violation Filtering

When I initially developed Stott Security, I didn't foresee the sheer volume of sources that would be added to each site. It's become apparent that some implementations contain upwards of 50 sources or more, making the list difficult to navigate. Additionally, the CSP Violation List can become overwhelming with potentially hundreds of violated sources.

To enhance user experience on these tabs, I've introduced the option to filter the list based on partial matches in the Source URL and the desired Directive. This feature aims to streamline navigation and improve usability for users dealing with extensive lists.  The free text filter will filter the list of sources to just those sources that contain the term entered. The drop down will filter the sources to just those which have been granted access to the specifically chosen directive; this can make it a lot easier to see which sources can perform a specific action.

![CSP Sources Tab in Stott Security](/assets/StottSecurityCspSourcesTab.png)

## Language Updates

I decided to rename the feature formerly known as "Remote CSP Whitelist" to "Remote CSP Allowlist". This choice reflects a shift towards more inclusive and descriptive terminology, opting for terms like Allowlist and Blocklist which are more overt in their meaning.

There is a lot of history to the terms "Whitelist" and "Blacklist" and often it is claimed that these have origins in trust and criminality respectively.  Blacklisting however has a darker history where it was used as a means of oppression with individuals being unable to gain employment for performing acts that were either not approved of by their employers (such as striking) essentially leading to them being pushed into poverty. Overall in the english language, where "White" is used in a term it is often associated with "Good" while "Black" is associated with "Bad".  Irrespective of the origin of these terms, the continued use of these terms is a form of micro-aggression that continues to reinforce racial divides and systemic racism. I do not pretend to be in a position of Authority on subject matters like this. How can I be when I am not the victim of racism? How can I tell you how that makes another person feel? What I want to do here is continue to learn and to try to show my fellow humans the respect they deserve while making my software as user friendly and intiuitive as possible.

The switch to Allowlist and Blocklist is a good move in terms of clarity. The terms Whitelist and Blacklist may not be immediately comprehensible to those unfamiliar with them as they rely on simple color prefixes. In a casual discussion with a lay-person, I found that while the concept of a Blacklist was quickly grasped, the Whitelist prompted confusion and required explanation. On the other hand, when I asked about Allowlist and Blocklist, they swiftly understood their meanings without ambiguity or prior knowledge.

Microsoft has already embraced the language of Allowlist and Blocklist.  This is immediately apparant in articles such as [Allow list for Microsoft Edge endpoints](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-security-endpoints) and [Azure SQL Database and Azure Synapse IP firewall rules](https://learn.microsoft.com/en-gb/azure/azure-sql/database/firewall-configure?view=azuresql).  Google is another one of the big players that have started to use this newer language as we can see from their documentation such as [Allowlists, denylists, and approved senders](https://support.google.com/a/answer/60752?hl=en).

## Customisable Reporting Endpoints

Stott Security has provided support for internal reporting endpoints since its inception, but the development journey for this feature has taken various paths. Initially, it employed a view component that generated a JavaScript tag to intercept browser events and transmit violations to the module's endpoint. Later, I modified this to align with standard definitions for the report-uri and report-to schema.

The community using the module requested the ability to deactivate internal endpoints and define external ones. As a result, the option to disable internal endpoints was introduced. While this reduces traffic to the CMS instance, it also prevents any further updates to the violation report screen and renders the Agency Allowlist functionality inactive. Additionally, the functionality to specify external endpoints for report-uri and report-to was added, although this data remains unused by the module.

I'm interested in exploring options to integrate the violation report screen with external endpoints. However, this may necessitate the creation of a distinct reporting service.

## CSP NONCE Support

A nonce is defined as a word or phrase that is meant to be used exactly once.  For a Content Security Policy, the nonce is a code that should be used once.  The browser will limit the execution of a script tag or style tag to just once per nonce value.  This can protect the website and it's users from replay attacks.

Stott Security was designed to protect the entire CMS website (both front and back end).  The Optimizely CMS interface is however incompatabile with nonce values and the use of a nonce within the CMS interface will outright block the entire UI.  In version 1.x of Stott Security, the nonce functionality was omitted for this reason.  In version 2.3 of Stott Security, the nonce functionality was added into the solution.  However due to a continued lack of support for nonce in the CMS interface, the Content Security Policy is instead generated both with and without a nonce depending on whether you are visiting a content page or attempting to visit the CMS interface.

## Preview Headers 

One downside of designing a UI for administrator ease of use is that it  hides the fully compiled list of headers from the administrator. To address this, a new tab has been added to the interface, displaying the compiled list of HTTP Headers included with each request. This allows technical administrators to review the generated headers more thoroughly. Additionally, the same API powering this tab can be accessed for headless solutions.

Excluding the Cross Origin Resource Sharing (CORS) headers from this list was a deliberate choice for two primary reasons. Firstly, I defer to the underlying framework to generate these headers dynamically in response to requests, rather than manually generating them. Secondly, certain headers are exclusively visible during pre-flight requests and may vary depending on the origin of the request.

## Import & Export Functionality

The user base for the module requested the ability to import and export configurations, with a common scenario being the need to transfer CSP configurations from a Preproduction environment to Production. Users may also wish to export settings before making and testing changes and have the option to revert to the last known good configuration.

This feature allows exporting all configurations as a JSON file, which can be downloaded and subsequently uploaded into the desired environment. Similar to any changes made directly within the user interface, the import process is fully audited as it may involve various actions:

- Creating or updating Content Security Policy settings
- Creating, updating, or deleting Content Security Policy sources
- Creating or updating Cross Origin Resource Policy settings
- Creating or updating miscellaneous response headers.

## Improved Performance

I received a report concerning performance issues occurring in production with the Stott Security module. Notable stability concerns were raised regarding the instantiation of numerous DB Contexts, resulting in connection limit breaches. Optimizely typically configures the Production environment with the most conservative setup initially, scaling up as necessary. This strategy is to keep the costs down on the DXP platform. However, in this instance, the limit of around 100 concurrent connections was surpassed, indicating that the database was scaled too low for a large client. In response, Optimizely temporarily resolved the issue by scaling up the database instance.

Upon receiving this report, I introduced additional logging into the DB context and key repositories to monitor instantiation frequency. Swiftly, I pinpointed areas for significant performance enhancement:

- Implemented caching for the CSP Settings Service.
- Replaced usages of the CSP Settings Repository with the Service.
  - The repository handles data access while the service coordinates with the caching layer and repository.
- Extended cache duration from 1 hour to 12.
- Implemented lazy instantiation for select repositories and the DB Context.
  - This prevented unnecessary instantiation of the DB Context unless needed.

In testing, there was a minimum reduction of 95% in all DB Context instantiation and database query calls. Deployment of these enhancements to the affected client resolved the stability issues. Within a week of resolving this issue, a second report surfaced, and I promptly advised the client to update the module within their solution.

## Release Notes

- [Version 2.1](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/157)
- [Version 2.2](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/171)
- [Version 2.3](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/178)
- [Version 2.4](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/181)
- [Version 2.5](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/201)
- [Version 2.6](https://github.com/GeekInTheNorth/Stott.Security.Optimizely/discussions/207)

