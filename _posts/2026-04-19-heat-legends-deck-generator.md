---
layout: post
title: "Heat Legends Deck Generator"
description: "A Legends Deck generator that supports Heat Pedal To The Metal and it's expansions Heavy Rain, Tunnel Vision and Rocky Road."
permalink: "/article/heat-legends-deck-generator"
category: 
  - Gaming
  - "Geek Stories"
image: "https://www.stott.pro/assets/heat-pedal-to-the-metal.png"
promoImage: "/assets/heat-pedal-to-the-metal.png"
promoImageAlt: "Box Artwork for the Heat, Pedal To The Metal board game."
extraCss: "/assets/css/heat-legends-generator.css"
extraJs: "/assets/js/heat-legends-generator.js"
---

## The Board Game

**Heat: Pedal to the Metal** is a fast-paced, push-your-luck racing game that captures the thrill and tension of high-speed motorsport with elegant, accessible mechanics. Players manage their car’s momentum using a clever hand-management system, balancing aggressive acceleration against the risk of overheating their engine as they navigate tight corners and long straights. Each race becomes a dynamic tactical puzzle, where timing, drafting behind rivals, and knowing when to take risks can mean the difference between victory and spinning out. With its quick turns, cinematic feel, and just the right level of strategic depth, it delivers an adrenaline-fuelled experience that feels both competitive and effortlessly fun.

The **Legends** module in **Heat: Pedal to the Metal** adds automated rival drivers to the race, making the track feel busier and more competitive without needing extra players. Each Legend follows simple but clever rules that keep them fast and unpredictable, forcing you to adapt your strategy as they jostle for position. It’s a great way to scale the game or sharpen your skills, whether playing solo or filling out a full grid.

The generator below is designed to vary difficulty levels and to include additional cars from the various expansion packs.

## Legends, Deck Generator

{% raw %}
<div id="heat-legends-root" class="my-4"></div>
{% endraw %}

## Creating The Deck Generator

One of the limitations of owning the base version of **Heat: Pedal to the Metal** and additional track expansions, is that you only have access to the original Legends deck. Not only is this deck restricted to the six base game cars, but it's also relatively small, which limits the randomness and variety in how AI drivers behave. You could approximate this with something simple like rolling a D10+9 and mapping the result to a corner limit, but that approach loses the nuance built into the original deck design.

The official deck encodes several subtle mechanics and limitations:

- The base deck only supports the 6 base game cars.
  - The Legends expansion is otherwise needed to use all cars in Legends mode.
- Each card has a unique speed for each driver.
- The distribution of speeds for each car is only semi equal due to the limited number of cards.
- There is a direct relationship of speed to corner limit, faster cards must stop further from the corner.
- There is no mechanism for making the race slightly easier or harder based on your experience.

To recreate and extend this system, I started by analysing the full set of cards. This involved looking at speed distributions per driver, validating how speed correlates with corner limits, and identifying patterns that could be generalised into rules.

From there, I built an initial version of the generator as a C# Azure Function, introducing adjustable difficulty levels:

- Normal
  - Corner Limit 0: 10 to 11 speed
  - Corner Limit 1: 12 to 14 speed
  - Corner Limit 2: 15 to 17 speed
  - Corner Limit 3: 18 to 19 speed
- Easy
  - Corner Limit 0: 8 to 9 speed
  - Corner Limit 1: 10 to 12 speed
  - Corner Limit 2: 13 to 15 speed
  - Corner Limit 3: 16 to 17 speed
- Hard
  - Corner Limit 0: 12 to 13 speed
  - Corner Limit 1: 14 to 16 speed
  - Corner Limit 2: 17 to 18 speed
  - Corner Limit 3: 19 to 20 speed
- Legendary
  - Corner Limit 0: 14 to 15 speed
  - Corner Limit 1: 16 to 17 speed
  - Corner Limit 2: 18 to 19 speed
  - Corner Limit 3: 20 to 22 speed

I then transitioned this into a client-side component for the site. Rather than rewriting it manually, I used an AI assisted workflow with Claude Code, converting the logic from C# into an embeddable React component through a series of iterative prompts. This process included:

- Explaining the game mechanics and desired functionality
- Converting the backend logic into a reusable React component
- Providing a reference image of a Legends card to drive the visual design
- Iterating on layout and styling
- Fixing mobile rendering issues

The AI handled the bulk of the conversion well, though not everything was seamless, attempts to generate a helmet icon were consistently poor across tools, so I ultimately replaced it with a manually sourced free SVG.
