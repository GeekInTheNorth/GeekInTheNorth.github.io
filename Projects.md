---
layout: basic
title: "Projects"
description: "Projects worked on by Mark Stott."
permalink: "/projects"
---

## Personal Projects

The following projects have been developed in isolation by myself outside of my professional role.

### Stott Security
*16th December 2021 to Present*

[Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) provides an interface for an Optimizely CMS Administrator to configure security headers such as Content Security Policies and to have the updates fully functioning without the need for a build or a deployment.  The interface is aimed at digital agencies and data analysts who frequently need to inject new scripts for third party tracking on commercial websites.

Given that this audience may not be a server side engineer, the user interface turns the management of the Content Security Policy on it's head, presenting the data analyst of CMS administrator with list of sources and what each source is allowed to do on the website.

e.g. Need to add a third party tracker from the CSP? the data analyst of CMS administrator can simply add https://*.my-tracker.com and grant it script-src-elem, style-src-elem and connect-src through one simple modal dialog containing a URL and some checkboxes. Likewise this makes it very easy to remove the same tracker when it is no longer required.

Additional features include:

- The ability to manage Content Security Policy headers through an easy to use interface:
  - Content-Security-Policy
  - Content-Security-Policy-Report-Only
- Automatic updating of the Content Security Policy based on a centrally controlled allowlist specified by the CMS Administrator.
- The ability to configure additional sources for the Content Security Policy for an individual content page.
- Content Security Policy Violation Report with the ability to easily allow any domain based on it's violation.
- The ability to manage Cross Origin Resource Sharing (CORS) headers through an easy to use interface:
  - Access-Control-Allow-Origin
  - Access-Control-Allow-Methods
  - Access-Control-Allow-Headers
  - Access-Control-Max-Age
  - Access-Control-Request-Method
  - Access-Control-Request-Headers
- The ability to manage simple security headers through an easy to use interface:
  - Cross-Origin-Embedder-Policy
  - Cross-Origin-Opener-Policy
  - Cross-Origin-Resource-Policy
  - Referrer-Policy
  - Strict-Transport-Security
  - X-Content-Type-Options
  - X-XSS-Protection
  - X-Frame-Options
- Complete Audit of all configuration changes.
- Import / Export of all configuration to allow migration between environments.
- Features Coming Soon
  - The ability to manage the Permission-Policy header.

Application Technologies:

- .NET 6.0 / .NET 8.0
- MVC
- Web API
- Entity Framework
- Optimizely CMS 12.x.x
- React
- Bootstrap

Platform Technologies:
- GitHub Actions (CI, PR Quality Gate)

### Stott Robots Handler
*11th December 2021 to Present*

[Stott Robots Handler](https://github.com/GeekInTheNorth/Stott.Optimizely.RobotsHandler) is a robots.txt handler for Optimizely CMS 12.x.x. This project provides the CMS Administrator with the ability to create and manage the robots.txt content for each site tree within the Optimizely CMS solution without requiring developer intervention or deployment.

Application Technologies:

- .Net 6.0
- MVC
- Optimizely CMS 12.x.x
- React
- Bootstrap

Platform Technologies:
- GitHub Actions (CI, PR Quality Gate)

### Roller Girl Gang Virtual Skate Marathon
*May 2024 to October 2024*

[Roller Girl Gang](https://www.rollergirlgang.co.uk/) is both a local business and community promoting and teaching Roller Skating in and around Leeds as well as existing as a skate goods store within Leeds known as the Skate Sanctuary. I was approached as I had previously supported their 2023 summer skate challenge.

As part of this, I updated the previously existing code base so that the content could be managed using the Kontent.ai CMS.  I also brought the code base up to date to host on Azure using .NET 8, Azure App Service and Azure Function Apps.

Application Technologies:

- .NET 8.0
- MVC
- Web API
- Entity Framework
- Microsoft Identities 
- Microsoft Identities for Strava
- Bootstrap

Platform Technogies
- Azure Web Apps
- Azure Function Apps
- Azure Storage Container
- Azure SQL Server
- GitHub Actions (CI/CD)

### Roller Girl Gang Virtual Skate Marathon
*May 2023 to October 2023*

[Roller Girl Gang](https://www.rollergirlgang.co.uk/) is both a local business and community promoting and teaching Roller Skating in and around Leeds as well as existing as a skate goods store within Leeds known as the Skate Sanctuary. I was approached as they were aware of my previous roller skate challenge statistic site for the ALL IN: Community Roller Derby to help them with their own virtual skate marathon.

As part of this, I updated the previously existing code base with new image assets and content and brought the code base up to date to host on Azure using .NET 7, Azure App Service and Azure Function Apps.

Application Technologies:

- .NET 7.0
- MVC
- Web API
- Entity Framework
- Microsoft Identities 
- Microsoft Identities for Strava
- Bootstrap

Platform Technogies
- Azure Web Apps
- Azure Function Apps
- Azure Storage Container
- Azure SQL Server
- GitHub Actions (CI/CD)

### ALL IN Leeds-Liverpool Skate Challenge
*19th September 2020 to 1st January 2022*

ALL IN Community Roller Derby is a not for profit organisation that work to remove cultural, geographical and financial barriers to getting people involved in the sport of Roller Derby. Maha of ALL IN approached me to see if I would be able to build them a small website to support a long distance virtual skate marathon that would help fund their activities. As a member of the Roller Derby community I was ready and willing to assist them in their needs.

The ALL IN website was constructed outside of standard working hours on a zero budget over the course of two months with additional updates on an ad hoc basis. Features include: user logins, Strava integration, leader boards, automated progress emails, user progress screen and an event statistics screen.

The site for this was taken down on the 1st January 2022 following the end of the challenge. Over the course of the event, participants skated a total of 5401 miles over 1040 individual journeys on roller skates.

Application Technologies:

- .NET Core 3.2
- MVC
- Web API
- Entity Framework
- Microsoft Identities 
- Microsoft Identities for Strava
- Bootstrap

Platform Technogies
- Azure Web Apps
- Azure Function Apps
- Azure Storage Container
- Azure SQL Server
- Azure Kudu (CD)

## Professional Projects

The following projects are those in which I acted in a technical leadership position within my professional career spanning 24 years.

### Hospitality Website, 26 Agency

A platform migration project from Umbraco 7 to Optimizely 12. I redefined the architectural pattern to use Feature Slicing and design patterns such as CQRS and Mediator. I developed the integrations into third parties such as GHA Discovery and SynXis.

Application Technologies:

- Optimizely CMS 12.x.x
- .NET 7.0
- MVC
- Web API
- CQRS / Mediator

### Solicitor Website, 26 Agency

This client had a complex workflow of data moving between Dynamics and the CMS. I identified that we would have to develop our own solution as existing plugins lacked the flexibility to meet the client’s needs. This involved extending key server-side components within Optimizely Forms by developing new form actors, data feeds and visitor groups within bi-directional data journeys between the CMS and Dynamics.

Application Technologies:

- Optimizely CMS 12.x.x
- .NET 7.0
- MVC
- Web API
- CQRS / Mediator

### Professional Body Website, 26 Agency

Acted as a technical consultant during the discovery phase for a large professional body aiming to migrate to Optimizely CMS 12. My role was to understand the client’s complex data flows and back-end systems as drawn up by a technical architect and to advise on the feasibility and solution that would be developed.

### Dental Supplies Website, 26 Agency

A merger of two separate Commerce solutions into a single multi-site solution built on Optimizely CMS 11 and Commerce. I tackled significant technical debt by migrating the solution onto a feature slice architectural pattern and implementing unit tests for key business journeys.

Application Technologies:

- Optimizely CMS 11.x.x
- Optimizely Customized Commerce 13.x.x
- .NET Framework 4.6.2
- MVC
- Web API

### Electronic Vehicle Charging Network, MMT Digital (Secondment)

Acted as development team leader for one of seven teams working on a large enterprise scale platform following the SAFe methodology. Each team handled a separate collection of microservices deployed within a Kubernetes cluster that was exposed to the UI through an API Gateway.

Application Technologies:

- .NET Core 3.2
- Web API
- Azure Cosmos Db for Mongo Db
- Azure Function Apps
- Azure Event Grid
- Azure Kubernetes

### Modular Buildings Website, 26 Agency

This was a new brand website built on Optimizely CMS 11. I implemented a custom form solution that integrated with a self-hosted Dell Boomi instance that I designed to handle a 95% uptime by separating form submissions from data integration.

I designed and built a CMS managed Visualizer that supported a fully customizable multi-branching question and answer flow. The result page was personalized based on the users' decisions, unifying content across dozens of content types. I built similar logic that created a fully personalized PDF served to the user upon completing a lead form.

Application Technologies:

- Optimizely CMS 11.x.x
- .NET Framework 4.8
- MVC
- Web API
- Entity Framework
- PDF Sharp
- Dell Boomi

### Dairy Website, 26 Agency

A brand site built on Optimizely CMS 11 aimed at the fitness market to sell fitness-based foods with high protein content. I designed and implemented the integration with a centrally managed recipe database that lived within the client’s own infrastructure. This allowed for the centrally managed recipes and CMS content to be served side by side in the same results on different listing pages.

Application Technologies:

- Optimizely CMS 11.x.x
- .NET Framework 4.7.x
- MVC
- Web API

### Dairy Website, 26 Agency

A brochureware brand site built on Optimizely CMS 11 that had to be built and deployed within 1 calendar month to meet the client's scheduled TV commercial campaign.

Application Technologies:

- Optimizely CMS 11.x.x
- .NET Framework 4.7.x
- MVC

### UK Payroll Cloud Solution, Cascade

I was the sole remaining developer able to develop and maintain their desktop solution built on Delphi 4 and Microsoft SQL Server.  I championed the need to rebuild the desktop solution as a web project due to the aging technology it was built upon and dire limit on staff able to maintain the product.  I was eventually granted the green light to commence development on what would be a multi year project.

As the team size for the project increased my role became a mix of Buisness Analyst and Technical Lead as I became responsible for drafting requirements for the team.  After aquiring a dedicated Product Owner for the project, I was able to then focus more on the Technical Leadership for the team and ensure that the application was built to a high standard.  During this time I helped transition the team onto Agile Methodogies such as Scrum as well as learning techniques such as Behaviour Driven Design (BDD), Domain Driven Design (DDD) and Test Driven Design (TDD).

As a result of the successful release of the project, the business became the first provider of an Integrated Human Resources and Payroll solution within the market place.  This fact would then become a key driver for a multi-million pound aquisition of Cascade by the Iris group.

Application Technologies:

- .NET Framework 4.7.x
- MVC
- Web API
- Entity Framework
- JQuery
- Javascript
