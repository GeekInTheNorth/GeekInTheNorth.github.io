---
layout: post
title: "Ticket to Ride : Scoreboard"
description: "A scoreboard that supports scoring calculations that are compatible with both the Classic and Europe versions of Ticket to Ride as well as the Legenday Asia expansion"
permalink: "/article/heat-legends-deck-generator"
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