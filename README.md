# 地球文明纪 · Earth Civilization Chronicle

**A solo-built browser strategy sim that replays 10,000 years of human history on a real world map — from the first farming villages in 8000 BC to the space age — and lets you watch, rule, or play god.**

▶ **[Play it in your browser](https://jasonmayg.github.io/earth-civilization/)** — no install, works on desktop and mobile. Available in **English** and **中文**: the page opens in your browser's language, and the EN / 中文 button switches at any time ([English](https://jasonmayg.github.io/earth-civilization/en/) · [中文](https://jasonmayg.github.io/earth-civilization/?lang=zh)).

<p align="center">
  <a href="docs/demo.mp4"><img src="docs/demo.gif" alt="Gameplay walkthrough: 10,000 years of history on a real map, civilizations rising, trading and fighting" width="92%"></a><br>
  <sub>Gameplay walkthrough (English edition): 10,000 years of history on a real map, civilizations rising, trading and fighting. ▶ <a href="docs/demo.mp4">Full video with captions (MP4, 1.5 min)</a></sub>
</p>

<p align="center">
  <img src="docs/screenshots/2-ancient.png" alt="2060 BC in a real-history world: dozens of civilizations on a real-geography map" width="85%"><br>
  <sub>2060 BC — dozens of civilizations across a real-geography map; the chronicle on the right records every war, treaty and invention</sub>
</p>

## What it is

A self-contained simulation (one HTML file, no server) where civilizations are born in river valleys, grow, split, convert, trade, fight and fall. Every run is a different alternate history, and every world is reproducible from its seed.

**Three ways to start a world**

| Origin | Description |
|---|---|
| Random evolution | Start in 8000 BC; names, cradles and outcomes are all procedural |
| Real history | 37 ancient civilizations appear at their real times and places, then history diverges |
| Modern start | ~110 present-day countries from 2025, starting from approximate real-world economy, tech, military, alliances and climate |

**Three ways to play**

| Role | Description |
|---|---|
| Observer | Hands off — let history write itself and read the chronicle |
| Ruler | Take over any civilization: treasury, policies, diplomacy, wonders |
| God | Spend divine power on revelations, plagues, great leaders and natural disasters |

Plus 8 scenario challenges (e.g. *Rome Eternal*, *King of the Steppe*, *A Century of Peace*), a versus mode, 14 world wonders from the Pyramids to a space elevator, 11 technological eras, emergent religions, 13 achievements, save/replay/rewind, and several map styles (parchment, atlas, night lights).

<p align="center">
  <img src="docs/screenshots/0-new-world.png" alt="New world setup" width="49%">
  <img src="docs/screenshots/3-classical-era.png" alt="Classical era" width="49%"><br>
  <sub>Left: choose an origin and a role. Right: 1500 BC — the "river of civilizations" chart below the map shows each civilization's share of the world over time.</sub>
</p>

## Design decisions

**Make history legible, not just simulated.** A simulation with hundreds of actors is noise unless the player can follow it. Three layers do that work: a running **chronicle** of discrete events ("Shang carves writing on oracle bones"), a **river-of-civilizations** chart that shows rise and fall at a glance, and **cinematic captions** for the biggest moments. "Next major event" lets players jump straight to what matters.

**Anchor the fiction in reality.** The world map, biomes and river valleys follow real geography, and the *Real History* mode seeds real civilizations at real dates, with real-world parallels surfaced as they happen ("in real history, Confucius was born in 551 BC…"). Familiar anchors make the divergence interesting.

**Same engine, three levels of agency.** Observer, Ruler and God are not separate games — they are different control surfaces on one simulation. This kept scope manageable while serving very different player motivations (watchers, strategists, sandbox tinkerers).

**Deterministic by seed.** A seeded RNG means any world can be shared and replayed exactly — useful for debugging balance, and for players comparing runs.

**Localize the system, not just the strings.** The game was written in Chinese, and its names were built from Chinese characters: dynasty names joined to titles, rulers given posthumous names, numbers counted in units of 10,000. The English edition is generated from the same source by a small build step (`tools/i18n`): about 4,300 pieces of text are translated as whole sentences (so word order can change), while name generators, number formats, dates and the AI rivals' keyword matching are rewritten for English. A check fails if any Chinese is left in the English page or if it falls out of date with the source.

**AI-native, but never AI-dependent.** When hosted on Claude, an LLM reads the run's chronicle and writes a full *History Book* of that alternate world, and an online mode lets several people share one world. Everywhere else the game detects the missing capability and runs fully offline — the AI layer is an enhancement, not a requirement.

## Tech

- Single-file HTML/CSS/JavaScript, Canvas rendering, no build step, no dependencies
- 180×90 cell world grid with biomes, regions and river valleys; seeded PRNG (mulberry32)
- Saves in browser local storage (separate save slots per language)
- English edition (`en/index.html`) generated from `index.html` by `tools/i18n` (Node + acorn): translation dictionary in `tools/i18n/en/`, code changes for English grammar in `tools/i18n/patches.js`
- Optional AI chronicle (`window.claude.use('sample')`) and multiplayer rooms (`window.claude.use('room')`), with graceful fallback

## Run locally

Download `index.html` (Chinese) or `en/index.html` (English) and open it in any modern browser. That's it.

To rebuild the English edition after changing the game:

```bash
cd tools/i18n && npm ci
node i18n.js extract   # list every piece of Chinese text (segments.json)
node i18n.js build     # write en/index.html; reports anything untranslated
node i18n.js check     # CI: fails if en/ is stale or contains Chinese
```

## Credits

Designed and built solo by **Jason Geng** — game design, simulation rules, historical data, UI and balancing.

---

© 2026 Jason Geng. All rights reserved. Shared for portfolio review.
