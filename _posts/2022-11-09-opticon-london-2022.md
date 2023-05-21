---
layout: post
title: "Opticon London 2022"
description: "Information learned at the Opticon London 2022 event hosted by Optimizely."
permalink: "/article/opticon_london_2022"
category:
  - Development
  - Optimizely
---

# Opticon London 2022

## About Opticon London 2022

Every year, Optimizely put on a three day conference in the US where they engage with potential and existing customers and with the development community.  They then follow this up with smaller versions of the same conference in differing countries with this years events taking place in San Diego, London and Stockholm. This annual event was formerly known as EPiServer Ascend, but with the brand shift to Optimizely, this event has now become Opticon; which oddly sounds like something born of the Transformers TV series.

Naturally the Opticon events do tend to have a theme which ties heavily into Optimizely suite.  The key focus this year is about how you can use Content Management Platform (Formerly Welcome) and Feature Experimentation (Formerly Full Stack) to improve the content marketing experience.

The opening sessions featured a content marketing demo with a very stereotyped "This is how we work now" comparison to how the Content Management Platform can streamline that experience.  Comparing management of content in word documents and excel documents that are being passed back and forth on email threads to using the integrated collaboration tools of the Content Management Platform.

## Unlock new possibilities by taking your Optimizely Digital Experience Platform to the next level.
_Presented by:_
_Michelle Azzopardi, the Digital & App innovation GTMM UK Microsoft._

This was the first of the breakout sessions that I went along to and covered the partnership of Optimizely with Microsoft and how the Optimizely DXP Platform is pushing the DXP experience to the next level in terms of sustainability and performance. Microsoft has very grand plans around sustainability in respect of it's Microsoft Azure platform, which means by adopting the Microsoft Azure Platform, you're already moving towards reducing the carbon footprint of your own websites. Microsoft's sustainability goals include the following:

- Carbon Negative by 2030
- Zero waste by 2030
- Water Positive by 2030
- Remove their historical carbon emissions by 2050
- Adding $1 billion Climate Innovation fund

The Microsoft .NET Ecosystem continues to grow, with there now being more than 5,400,000 .NET Developers.  Nearly 7,000 of those developers having made a combined 21,000 contributions to improve quality and performance of the .NET 6 framework. As a result .NET 6 is now rated as 10x faster than Node and 2.5x faster than Java Serverlet.  Entity Framework alone is now 92% faster on .NET 6 compared to .NET 5.

![](/assets/opticon-london-1.jpg)

The Optimizely Community also continues to grow...

- 29,000 Optimizely sites hosted in Optimizely DXP Cloud.
- 800+ Digital Agencies developing Optimizely solutions.
- 40,000 Optimizely developers.
- 87 Optimizely Most Valuable Professionals
- 300+ AddOns created by software houses and the community

By moving to .NET 6 and Linux based Azure Web Apps for CMS 12 and Commerce 14, Optimizely is now enabling those agencies to bring the performance improvements and a reduced carbon footprint to the entire DXP platform.  To make this journey easier, the PAAS Portal now contains a Project Migration tool that allows developers to manage the migration of a .NET 4.x CMS 11 solution to a .NET 6 CMS 12 without the intervention of Optimizely themselves.

It should be noted that all future development will be targeted against the CMS 12 and Commerce 14 systems.  As part of transitioning from CMS 11 to CMS 12, clients can gain access to all of the following new features:

- Content Management Platform (Welcome) DAM integration
- Content Management Platform (Welcome) structured content integration
  - This is currently in beta and will direct transfer of content from the Content Management Platform into the CMS.
- Headless editing
- Optimizely Data Platform Integration
  - Including Real Time Segmentation for CMS
- Liquid Templates Support (Via Optimizely Labs)
- Improved Admin Functionality
- Improved Accessibility

Other changes that are currently in development for CMS 12 include:

- New Tag Helpers
- List Property Support
- OptiID -> A New Cross platform identity integration
- TinyMCE 6 Upgrade
- Dashboard support

## Get more from your digital experience with Data Platform
_Presented by:_
_Nazanin Ramezani, Chief of Staff, Optimizely_
_Jacob Khan, GVP, Solution Architect, Optimizely_

This was the second of the breakout sessions that I attended at Opticon London and was focused on the Optimizely Data Platform which formerly known as Zaius before being acquired by Optimizely in March 2021.  This session covered benefits of using Optimizely Data Platform to understand user's better and to provide flexible personalization based on user behaviour.

The number of connectors for Optimizely Data Platform has been growing, allowing data to be consolidated between website interactions and third party sources.  The new Real Time Segmentation functionality takes this data and allows user's to create segmentations on users that are updated in near real time.  These segments can then be utilized as visitor groups within the CMS itself.

![Nazanin Ramezani & Jacob Khan talking about getting more from your digital experience with the Optimizely Data Platform](/assets/opticon-london-2.jpg)

Tracking of users can be tied to both client side and server side events and can include all of the following:

- Page Views
- Customer Events
- Commerce Events
- Example Events:
  - Forms
  - Search
  - Video Interactions
  - Clicks: links, buttons, downloads, accordions
  - Scroll tracking

## Scale your experimentation with Feature Experimentation
_Presented by_
_Joey Moore, AVP Product, Optimizely_
_Stewart Ehoff, Head of Experimentation, RS Group_

The original presenter for this talk was no longer able to attend, so Joey Moore presented this talk instead about the Optimizely Feature Experimentation product.  The product provides a powerful testing tool that allows content editors and marketers to experiment across their entire stack. The power of this functionality is improved by business' engaging their developers to support experimentation, not just within the browser but in terms of application business logic by utilizing feature flags.  The product itself was covered in brief before turning into a one to one with Stewart Ehoff.

The Delivery Platform highlights of Feature Experimentation includes the following functionality:

- Has a rules engine
- Flexible Architecture
- Handles variables
- Handles multiple environments
- Allows testing at the edge
- Works with feature flags
- Supports web hooks
- Supports rollouts
- Allows you to work API First
- Contains a Change History

The Optimization Layer of Feature Experimentation Optimisation includes the following functionality:

- Supports concurrent A/B Tests
- Supports Personalization
- Supports Variations
- Mutual Exclusivity
- Has a rules engine
- Has a stats engine
- MAB
- Stats accelerator
- Data Integration
- Metrics
- Audiences

Joey and Stuart then went on to talk about Stuart's experimentation journey. Stuart is the the head of Experimentation at the RS Group who sell engineering supplies.  The RS Group actively perform hundreds of experiments a year on their website.

![](/assets/opticon-london-3.jpg)

Originally the RS Group were doing mostly web based experimentations with JavaScript injected by GTM on key pages which in turn later had to be merged back into the main code base.  They have now moved exclusively to feature switches for experimentation by including the development team in the experimentation process which opened up more doors for potential testing.  This was achieved by using the feature experimentations project and said feature flags within the code base that allows them to turn on functionality for either a segment or proportion of the user base and to understand how performance was improved.

Stuart's take away advice was to start small. Start with web based experimentations and make them small at first and slowly build up with the A/B testing.  Then properly involve a developer in the process to make bigger and better tests. The most successful tests are based off of previous tests.  Do one test, learn something, devise a second test based on those learnings and then potentially do a third.

## Building a Powerful Commerce Engine
_Presented by_
_Josh Schoonmaker, Global VP of Product, Optimizely_

I was expecting a talk about B2B or B2C commerce here, but really this was actually a promotion of using Optimizely Data Platform and Feature Experimentation to improve your commerce site. A lot of statistics were provided as to why you should aim to use data to actively personalise content for users and use experimentation and how its now really expect by most of your users.

![](/assets/opticon-london-4.jpg)

The main take away points for me on this subject are as follows:

- The younger generations that have grown up with technology are not only aware of personalisation, but expect it to be implemented to streamline their web experience.
- When generating personalised content, it should appear like it belongs on the medium rather than being invasive.  In terms of language this can be a case of replacing "Hello Tom, last time you bought stuff like this" with something more neutral like "we think you may like this".
- Design your product pages in a way that is supportive as a landing page.  Many people will search for a product via Google or Bing resulting in your landing page being their first interaction on your site.
- Make your search bar visible and easily accessible, if you're a commerce site your user's will want to be able to search your content and products easily.  User's may not even engage with your product page following a Google search and will immediately search your site to view all of your matching offerings.

## In Summary

The following are my take on the day's advice.

- Upgrade to Optimizely CMS 12 & Commerce 14 on Optimizely DXP within Microsoft Azure. You will gain significant performance improvements requiring less infrastructure to meet the same results; Leading to a more sustainable website.
- Invest in Optimizely Content Management Platform to streamline the planning of your campaign content and then deliver it straight into your Optimizely CMS with the new integration tools.
- Invest in Optimizely Data Platform and bring all your sources of data together to better understand your customers and to provide a richer more personalised experience.
- Invest in Optimizely Feature Experimentation and A/B test often and in multiple stages to guide the evolution of your content and website to better engage with your customers. 