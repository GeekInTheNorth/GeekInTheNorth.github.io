---
layout: post
title: "Helping Opal Build LLMS.TXT Content"
description: "Using Instructions to help Optimizely Opal generate llms.txt content."
permalink: "/article/helping-opal-build-llms.txt-content"
category:
  - Development
  - Optimizely
  - "Stott Robots Handler"
relatedArticles:
  - "_posts/2025-09-17-stott-robots-handler-v6.md"
---

In my previous blog, [Opal Tools Support Comes to Stott Robots Handler v6](/article/stott-robots-handler-v6), I shared the news about new Opal Tools being built directly into the Stott Robots Handler AddOn for Optimizely PAAS CMS 12.  In practice Opal handles generating and modifying **robots.txt** content effectively using these tools.  However, it currently lacks the ability to structure or generate an valid **llms.txt** file. This is where instructions can help you achieve success.

## What Are Instructions?

Opal instructions are written in markdown and help guide Opal in it's tasks. I asked Opal to describe Instructions and what their intent was and Opal had the following to say:
 
>Opal Instructions are the guidelines and rules that govern my behavior and responses as the Optimizely AI Assistant. Their primary intent is to ensure that I:
>
>- **Provide specific and actionable guidance:** Instead of generic advice, I aim to give you concrete steps and relevant information.
>- **Understand and utilize context:** I use your current workflow, user information, and the Optimizely product you're using to tailor my responses.
>- **Prioritize and use tools effectively:** The instructions help me decide which tools to use (like creating campaigns, tasks, or searching documentation) and in what order, to best fulfill your request.
>- **Focus on business outcomes:** My responses are geared towards helping you achieve measurable results in digital optimization, experimentation, and customer experience.
>- **Maintain a consistent and helpful persona:** They guide my communication style, ensuring I use appropriate terminology and offer clear, concise, and thorough explanations.
>
>In essence, these instructions are my operational manual, designed to make me a more effective and helpful assistant for you within the Optimizely platform.

## Where to Manage Instructions

To view instructions, open the Optimizely Opal Interface and click on the instructions button in the left hand menu (book icon).  Opal comes with a number of built-in instructions that you can view and use as examples for building your own instructions.

![A screenshot of the Instructions list screen in the Optimizely Opal interface](/assets/robots-handler-opal-tools-7.png)

When you click on the Add Instruction Button, you will be provided with this screen, which will allow you to:

- Name your Instruction
- Enter the details for your instruction
- Define where the instructions can be used.

![A screenshot of the Instructions list screen in the Optimizely Opal interface](/assets/robots-handler-opal-tools-8.png)

You can read more about managing instructions over in Optimizely's support documentation here: [Instructions overview](https://support.optimizely.com/hc/en-us/articles/36353487109133-Instructions-overview)

## Creating Instructions for Generating LLMS.TXT Content

The instructions content should start with an overview, this should give Opal the context of what it will be doing and what it will be expected to do.  Then define the execution steps; Each step should be built be built up of one or more bullet points that allow it to complete that step.

A bullet labeled **Prompt** tells Opal to request specific input from the user. If the user has already provided this in their own prompt, then Opal will recognize this and move onto the next bullet.  A bullet labeled with **Action** will provide Opal with the knowledge of the actions it will need to perform before feeding back to the user.

In the following instructions, I have split the execution into three main steps:

- Analysis
  - Request a URL for the home page of the website we are generating the llms.txt content for.
  - Review the requested page and generate a title, a synopsis and a collection of links ordered by section.
- Generation
  - Use the information gained in the Analysis step to generate the llms.txt content using the example detailed in the Generation step as an example
- Review
  - Show the generated llms.txt content to the user.
  - Ask them if they would like to save the llms.txt content and which host name they want to save it for
  - Save the llms.txt content using the tool provided by the Stott Robots Handler

Here is my example instructions content:

```

```

Before I created these instructions, when I asked Opal to generate an **llms.txt** file, it would typically provide me with a content not too dissimilar to **robots.txt** style content.  Using these instructions I was able to get Opal to scan my personal website and generate a starting **llms.txt**.

_Note that I have trimmed down this generated output for brevity:_

```

```

## In Summary

Opal Tools can be used to grant new functionality to Opal, but it is through the power of instructions that you can go from functionality to high impact.  With more investment into the **llms.txt** instructions, you can help Opal craft great content for your **llms.txt** that is more specific to your business and the websites you release your content on.  Opal Tools and **llms.txt** functionality is available in **Stott Robots Handler v6** for **Optimizely PAAS CMS 12** now.
