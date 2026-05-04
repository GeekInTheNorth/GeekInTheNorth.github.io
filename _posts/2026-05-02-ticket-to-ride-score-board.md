---
layout: post
title: "Ticket to Ride : Scoreboard"
description: "A scoreboard that supports scoring calculations that are compatible with both the Classic and Europe versions of Ticket to Ride as well as the Legendary Asia expansion"
permalink: "/article/ticket-to-ride-scoreboard"
category: 
  - Gaming
  - "Geek Stories"
image: "https://www.stott.pro/assets/ticket-to-ride.png"
promoImage: "/assets/ticket-to-ride.png"
promoImageAlt: "Box Artwork for the Ticket to Ride Europe board game."
extraCss: "/assets/css/ticket-to-ride.css"
extraJs: "/assets/js/ticket-to-ride.js"
relatedArticles:
  - "_posts/2026-04-19-heat-legends-deck-generator.md"
---

Few modern board games have achieved the widespread appeal of <a href="https://www.daysofwonder.com/game/ticket-to-ride/" target="_blank">Ticket to Ride</a>, a beautifully simple yet deceptively strategic railway adventure where players compete to connect cities and complete secret routes across a growing map. While the original Ticket to Ride: USA offers a clean, accessible experience, it can sometimes feel like the optimal path leans heavily toward long coast-to-coast connections. By contrast, <a href="https://www.daysofwonder.com/game/ticket-to-ride-europe/" target="_blank">Ticket to Ride : Europe</a> elevates the gameplay with tunnels, ferries, and stations, opening up far more varied tactical decisions and making it my personal favourite for its richer, more dynamic routes to victory.

Often we leave our scoring until the end of the game since a number of points cannot be scored until the end of the match.  There is also a level of delight in guessing how we are doing in comparison to each other.  I originally made a spreadsheet with lots of nice formulas to make totting up our scores a lot easier.  AI assisted development enabled me to recreate this as an embedded application in just 1 hour.

## Ticket to Ride Scoreboard

{% raw %}
<div id="ticket-to-ride-root" class="my-4"></div>
{% endraw %}

## Creating the Scoreboard

This was another experiment to see if I could build this as an embeddable component and how quickly I could get there.  I started off with the following specification for Claude Code:

```
We are going to build a new Scoring chart to support the board game "Ticket To Ride" and some of its expansions.  Key requirements:

- Set up form to include the option to choose a number of players and to define their names.  This should be limited between 2 and 6 players.
- Scoring chart
  - Train Routes of length 1 score 1 point each
  - Train Routes of length 2 score 2 points each
  - Train Routes of length 3 score 4 points each
  - Train Routes of length 4 score 7 points each
  - Train Routes of length 5 score 10 points each
  - Train Routes of length 6 score 15 points each
  - Train Routes of length 8 score 21 points each
  - Trains lost servicing mountains score 2 points each
  - Players score an additional 4 points per unused station, players have a maximum of 3 stations
  - The player with the longest continuous route scores an extra 10 points, only 1 player can score this
  - Players score additional points for each train journey ticket they complete.  Scores vary between 1 and 25 points.  Making this a clickable set of cards would be helpful
- Ideally we should do one score accumulation in waves:
  - Train Routes
  - Stations
  - Mountain Trains
  - Tickets

This should be built in the TicketToRide folder as a brand new react application.  the distribution assets should be limited to:

- ticket-to-ride.css
- ticket-to-ride.js
- index.html (we will use this locally for testing, but this will not be deployed)
```

Claude looked at the subfolder for my previous component that I built ([Heat, Pedal to the Metal - Legends Generator.](/article/heat-legends-deck-generator)) and used that as a baseline structure for how to build out this component as well as matching its stylistic outputs. During the initial planning stage it asked me further questions to clarify the approach as there were 6 types of point scoring but only 4 waves initially specified. Throughout the process I gave Claude additional rounds of feedback while I verified behaviour of the component in the browser.  Iterations included:

- **Using a train icon:** At first a free svg was downloaded but it didn't work well and it was over 300kb.  Claude created a new svg embedded in a JavaScript method that is less than 1kb. Additional instructions were required to use this consistently.
- **Consistent UI:** There were a few iterations around how each wave of scoring was presented.  Particularly around the Train Route and Ticket scoring where the UI was originally quite different.
- **Mobile Friendly UI:** While at first glance the UI was very usable, once I tested it on a mobile device viewport, much of the scoring UI was off screen making it unusable.  This took several rounds of feedback to sort out as the UI was explored in more depth.
- **Reset Functions:** The train routes and tickets were responding nicely to quick taps, but removing or correcting was a little fiddly. Adding a reset button made this a little easier to use.

Overall, putting this together took just over an hour, 1 specification and 18 rounds of iterative instructions all within the Claude Code interface to build this component.  It was a fun challenge and it shows how quickly you can build simple solutions within AI.