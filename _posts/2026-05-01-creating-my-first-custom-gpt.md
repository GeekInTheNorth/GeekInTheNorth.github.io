---
layout: post
title: "Creating My First Custom GPT"
description: "I built a new Custom GPT for my DJ website entirely through conversation with ChatGPT, here is a break down of how this went."
permalink: "/article/creating-my-first-custom-gpt"
category:
  - Development
image: "https://www.stott.pro/assets/dj-custom-gpt.png"
promoImage: "/assets/dj-custom-gpt.png"
promoImageAlt: "An infographic for the article."
relatedArticles:
  - "_posts/2025-09-19-helping-opal-build-llms-txt-content.md"
  - "_posts/2025-09-28-creating-opal-tools-for-stott-robots-handler.md"
---

A Custom GPT is essentially a configured version of ChatGPT with its own persona, instructions and a small set of tools (called **Actions**) that it can call out to.  You don't need to write any backend code to host the GPT itself; you describe the behaviour you want, point it at any APIs you'd like it to use, and OpenAI does the rest.  It's a very low ceremony way to put a conversational front end on top of an existing service, which made it a tempting fit for a side project I've been wanting to dress up for a while.

For my first attempt I picked something deliberately small but real: my own DJ portal at [dj.stott.pro](https://dj.stott.pro).  The site already exposes upcoming events and music requests via a JSON API, so the goal was to wrap those endpoints in a friendly DJ persona and see how far I could get without writing a single line of new server-side code.

> 💡**Note**: In order to create and publish Custom GPTs you must have a Chat GPT account that is on the Plus tier.

## Why The DJ Portal

The DJ portal does two things that map cleanly to a chat experience:

- It lists my upcoming Ceroc and modern jive events with dates, venues and times.
- It lets dancers search a track library and submit music requests for a specific event.

Both are very natural things to ask a chatbot.  *"Where are you playing next?"*, *"Do you have anything by Caro Emerald?"*, *"What's been requested for the Tadcaster freestyle?"* are all questions a dancer would otherwise have to navigate through several pages to answer.  It's also a nicely contained domain.  Only three of the four public endpoints were involved, which keeps the surface area manageable for a first GPT.

![An example of the Custom GPT in action](/assets/dj-custom-gpt-example.png)

## Building It Through Conversation

There are two ways to put a Custom GPT together.  OpenAI offers a dedicated **GPT Builder** which has both a form based approach and a chat experience: a build agent walks you through who the GPT is for, how it should behave, and what tools it should have, updating the configuration fields for you as you talk.

I personnally chose to start in a regular ChatGPT conversation to *draft* the instructions and the OpenAPI schema iteratively, then created the Custom GPT itself through the standard **Create a GPT → Configure** screen by pasting the instructions into the Instructions field and the schema into the Actions section.  This worked well for me for a few reasons:

- I wanted full control over the wording of the instructions rather than having a builder agent rewrite them on my behalf.
- It let me treat the instructions and the schema as documents I could keep in source control alongside everything else.
- I could iterate on tone, structure and rules in one long conversation, then paste a clean final version in once I was happy.

My opening prompt was deliberately practical.  I gave ChatGPT the site URL, a one-line description of what the site was about, and a small subset of the API endpoints I wanted the GPT to consume.  No persona, no tone, no rules at this stage; just enough context for it to understand the domain and the surface area.  The persona, behavioural guardrails and per-tool guidance all came later, in subsequent turns of the conversation.

```
I have some API endpoints I want to put into a custom gpt:

The website is https://dj.stott.pro and is about events where I'm going to be DJing and making music requests. I want to start off with a subset of the APIs for consumption.

List Events: Lists upcoming events where I will be DJing<br/>
GET: https://dj.stott.pro/api/events/list/

Track Search: Search for music suggestions where query is an artist or track name<br/>
GET: https://dj.stott.pro/api/tracks/search/?query=
```

Some changes that came out of the back-and-forth, we covered the following items to improve the:

- Improving actions by increasing the specification of the API endpoints
- Constraining track recommendations to a BPM range that suits modern jive.

Items that ChatGPT considered without prompting included:

- Telling the GPT to never expose internal IDs (user IDs in particular).
- Filtering out cancelled events from any responses.
- Adding light DJ insight to its responses rather than reading out raw API data.
- Limiting the number of results shown so a reply doesn't turn into a list dump.

That last one is a recurring theme.  Left alone, an LLM happily returns everything an API gives it.  A few sentences of "show no more than three to five tracks" or "highlight one or two events" makes the difference between a useful assistant and a wall of text.

If you'd rather not maintain the instructions and schema as separate documents, GPT Builder is a perfectly reasonable starting point.  You can always switch to the Configure tab afterwards and edit by hand.

## The Configure Screen

The Configure screen is where the GPT actually comes together.  The left half is a form covering the name, description, instructions, conversation starters, knowledge files, capabilities and Actions.  The right half is a live preview of the GPT, fully functional and calling your real Actions, but only visible to you.

![The Custom GPT Configuration screen](/assets/dj-custom-gpt-creation.png)

The preview pane is very useful when making small and frequent changes to the Custom GPT.  Every change to the instructions and every tweak to the OpenAPI schema was immediately testable in the chat panel without saving, sharing or publishing anything.  Add a new rule, ask a question that should exercise it, and the effect is visible straight away.

This change-test-refine loop happens entirely in private.  The GPT doesn't go anywhere until you explicitly choose a sharing level, which makes the Configure screen a genuinely safe place to experiment.

## Defining The Behaviour

The instructions are where most of the personality and the guardrails live.  Mine ended up as a structured Markdown document covering core behaviour, per-tool rules, DJ-specific knowledge, how to handle vague requests, and a short example of the desired response style.  A few extracts give the flavour:

```markdown
## Tracks (`searchTracks`)

Call this tool when the user asks for:
* a specific song or artist
* music suggestions
* a vibe, genre, or style

### Query building:
* Convert natural language into a simple search query
  * "something funky" -> "funk"
  * "smooth bluesy" -> "blues smooth"
  * "upbeat pop" -> "pop upbeat"

### When using results:
* Show max 3-5 tracks
* If BPM > 0, optionally include it
* If BPM = 0, ignore it
```

A few patterns I would repeat for any future Custom GPT:

- **Be explicit about what *not* to expose.**  If your API returns IDs, request UUIDs, or internal status codes, tell the GPT not to surface them.  Otherwise it cheerfully will.
- **Translate between user language and API language.**  My users say "something funky"; the API takes a search string.  Documenting that translation in the instructions is far more reliable than hoping the model will infer it.
- **Give it an example.**  A short, formatted example of the response style anchors the tone better than several paragraphs of adjectives.
- **Cap result counts.**  Real APIs return everything that matched.  A chat reply needs only the best handful.

## Wiring Up The Actions

Actions are the bridge between the GPT and a real API.  You provide an OpenAPI 3.1 schema describing the endpoints, parameters and response shapes, and the GPT figures out when to call which operation based on the user's intent and the operation summaries.

For the DJ portal I described three operations:

- `listEvents` to retrieve upcoming events.
- `searchTracks` for the track library.
- `listMusicRequests` to show what has been requested for a specific event.

The schema itself is a fairly standard OpenAPI document.  The bits that matter most for a Custom GPT are the **operationId**, the **summary** and the parameter **descriptions**, because those are the fields the model uses to decide whether and how to call the operation.  Vague summaries make the GPT hesitate; precise ones make it confident.

```json
"/api/musicrequest/list/": {
  "get": {
    "operationId": "listMusicRequests",
    "summary": "List music requests made for a specific DJ event",
    "parameters": [
      {
        "name": "eventId",
        "in": "query",
        "required": true,
        "description": "The GUID of the event from the event listings API",
        "schema": { "type": "string", "format": "uuid" }
      }
    ]
  }
}
```

> 💾 **Note:** The full schema can be seen here: <a href="https://github.com/GeekInTheNorth/DjPortal/blob/main/GPT/Schema.json" rel="nofollow" target="_blank">schema.json</a>

The interesting wrinkle here is that `listMusicRequests` requires an `eventId` that the user is very unlikely to know off the top of their head.  In the instructions I taught the GPT to chain the calls: when someone names an event by venue or date, look it up via `listEvents` first, match it, and then use the returned `id` for the request lookup.  Once that pattern was written down, the GPT did it correctly without further prompting.

```markdown
If the user names an event rather than providing an eventId:
1. Call `listEvents`
2. Match the event by name, date, or venue
3. Use the matched event's `id` as `eventId`
4. Then call `listMusicRequests`
```

That's a small piece of orchestration that, in a traditional integration, you'd write in code on the server.  Here it lives as a few lines of natural language in the instructions.

## Authentication And Privacy

The DJ portal endpoints used by the GPT are public read endpoints, so there's no API key in this iteration.  If I were exposing anything that mutated state (such as actually submitting a music request rather than just listing them), I'd switch the action to use an API key or OAuth and lock the corresponding endpoint down on the server side.  The Custom GPT configuration supports both authentication styles straightforwardly; what it can't do is excuse you from getting your authentication model right at the API layer.

## Publishing The Custom GPT

Once the GPT is configured, the next decision is who gets to use it.  On a personal ChatGPT account there are three sharing levels, each with different trade-offs:

- **Only me (Personal).** The GPT is private to your account and doesn't appear in any shared list.  This is the right setting while you're iterating on the instructions and shaking out unexpected behaviour, and it's where I'd recommend anyone starts.
- **Anyone with the link (Shared Link).** A semi-public option.  Anyone you send the link to can use the GPT, but it isn't discoverable through the GPT Store.  This is a good middle ground for sharing with a small group such as friends, a community or a closed test cohort.
- **GPT Store (Public).**  The GPT is listed in OpenAI's public GPT Store, where any ChatGPT user can find and use it.  Publishing here requires a verified builder profile, and any Actions you've configured must point to a valid **Privacy Policy URL**.  Public GPTs also need to comply with OpenAI's content and use-case policies.

For the DJ portal GPT I went with **Anyone with the link**.  It lets me put it in front of a handful of friends and see how the behaviour holds up under real questions, without the extra commitment (or the verified builder profile and Privacy Policy URLs) that listing in the GPT Store would require.

## Closing Thoughts

Building a Custom GPT is a refreshingly direct way to put a chat front end on an existing API.  The combination of a well-written instructions document and a clean OpenAPI schema covers most of what you need, and the bulk of the investment isn't in code; it's in being precise about how you want the assistant to behave, what it should never say, and how to translate between the way users actually talk and the way your API expects to be called.

A few takeaways from the build worth carrying into any future GPT:

- **Treat ChatGPT as a thinking partner during drafting.**  It volunteered useful guardrails I might have only thought of after the fact; such as filtering cancelled events, hiding internal IDs, capping result counts, adding DJ insight rather than reading API data verbatim.
- **Keep the instructions and schema as separate documents.**  Versioning them alongside the rest of the site repository and pasting clean copies into the Configure screen made iteration far less stressful than editing live.
- **Operation summaries and parameter descriptions do most of the work for Actions.**  A little extra time on those is the difference between the GPT confidently picking the right operation and hesitating or asking the user a clarifying question.
- **Pin down privacy and what-not-to-expose rules from day one.**  It's far easier than walking the model back later.

If you've got an existing API and a use case that's naturally conversational, I'd recommend giving it a try as a weekend project.  Start with three or four endpoints, write the instructions like you're briefing a new team member, and pay particular attention to what your API returns that you don't want a chatbot to repeat back.  The rest is iteration.
