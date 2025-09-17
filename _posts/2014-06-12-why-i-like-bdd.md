---
layout: post
title: "Why I Like BDD"
description: "How Behaviour Driven Design (BDD) made my life easier."
permalink: "/article/why_i_like_bdd"
category:
  - Development
---

Behaviour Driven Development (BDD) was developed by Dan North and it is a evolution from Test Driven Development (TDD). It is a means of specifying how software will work that uses Ubiquitous Language that is familiar to Developers, Business Analysts and Product Owners. A lot of people have written a lot about what BDD is all about, in this blog I want to talk about why I like BDD and why I think you should use it. To help you get some background, here are a few nice links:

- [Introducing BDD by Dan North](https://dannorth.net/introducing-bdd/)
- [Behaviour Driven Development](https://en.wikipedia.org/wiki/Behavior-driven_development)

I have spent three years on a major product rewrite, for two thirds of that time I had no Product Owner or Business Analyst to help me. While I am experienced with the domain for the product, the rest of my team was not, so I found myself spending a lot of my time acting in the missing roles rather than actually coding. During this time I went through several methods of specification until I was introduced to BDD and Cucumber. My life at that point got a lot easier when it can to specifying features.

Before BDD, I would spend a long time writing a specification document that would include lots of information which was conveyed in a mix of bullet points, paragraphs a mock-ups using [Balsamiq](https://balsamiq.com/). After those were written and the developers and testers had added their contributions, more time would be spent in breaking that specification down into deliverable features and [User Stories](https://en.wikipedia.org/wiki/User_story). A tester would then look at these and then write their own set of acceptance criteria and tests. That is an awful lot of writing which had a risk of being inconsistent or having misunderstandings being carried from one stage to the next. There was nothing lean about this process and I spent almost all my time in work dealing with this and often a considerable amount of my own time. More importantly we had regular problems where behaviours were not identified. The whole process was painful.

As with learning any language, learning BDD as a specification language had a learning curve. I would sit down and try and think about the different behaviours or use cases and I would try and translate them into the Given When Then style. I had to learn how to break down a specification into discreet testable behaviours and I had to learn how to use ubiquitous language that was understandable by everyone. It was hard at first, and it required a lot of iterations through any given specification. Eventually it would resemble something like this:

```
Feature: Calculate BACS Hash Code

Scenario: BACS Hash code seeds are not generated if they are not required
Given I have marked the Employee as NOT needing a BACS Hash Code
When I calculate the Employee
Then a BACS Hash Code should NOT be generated
And any previously generated BACS Hash Code should be cleared for the employee
And any previously generated BACS Hash Code Seed should be cleared for the employee

Scenario: BACS hash code seeds are generated if required
Given I have marked the Employee as needing a BACS Hash Code
And a BACS Hash Code Seed has NOT previously been generated
When I calculate the Employee
Then a BACS Hash Code Seed should be generated
And the BACS Hash Code Seed should be four characters in length
And the first character of the BACS Hash Code Seed should be a forward slash
And the remaining characters of the BACS Hash Code Seed should be a random letter
```

A couple of months down the line I found there were so many benefits...

- **Faster Specifications:** Starting with a bullet point scope, I could create the mock-ups and the BDD scenarios in half the time of a traditional wordy specification.
- **Faster User Story Creation:** Previously I had to the write user stories in our tracking system almost from scratch based on the specification document. This quickly turned into a cut and past exercise from the BBD Scenarios into the User Story. It was the exact same language.
- **No More Test Notes:** Previously a tester would have to spend time writing extensive test notes and scenarios ... this exercise was almost made entirely defunct because the BDD Scenarios were the test notes.
- **Reduced Specification Errors:** I found that the actual process of writing the scenarios enabled me to get into a very specific mindset and as I wrote scenarios I was able to identify further scenarios that may not have been realised until much later on in the development process.
- **Automated Testing:** In this case I only prototyped some automated tests using SpecFlow. Specflow matches each line in your scenario to a given method that will set up, execute or assert each line in the scenario depending on whether it is a Given, When or Then statement. Some effort is required to create these methods, but the top level automated tests use the same language used throughout the entire process and form long running documentation.