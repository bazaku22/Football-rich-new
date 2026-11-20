# Football rich club crests — 2026/27

This directory records the club-logo mapping used by Football rich.

- European coverage: Premier League, La Liga, Bundesliga, Serie A and Ligue 1 (111 team entries, including historical clubs).
- Japan coverage: J1 League (20 clubs) and J2 League (20 clubs) for 2026/27 (registry integration validation in progress), maintained separately in [jleague-2026-27.json](jleague-2026-27.json).
- European crests load as direct static PNG files from the ESPN logo CDN. Football rich does **not** call ESPN sports-data APIs or retrieve fixtures, scores, standings or statistics from ESPN.
- J.League crests load as direct static PNG image assets from FootyLogos. Football rich does not call sports-data endpoints.
- Team names are normalized and common aliases are mapped to the same crest. If an image cannot load, the existing initials fallback remains active.
- The J1/J2 list is checked against the official J.League club composition for the 2026/27 season.

European source collection: https://github.com/frertommy/team-logos  
European source manifest: https://raw.githubusercontent.com/frertommy/team-logos/main/manifest.json  
J1 logo collection: https://www.footylogos.com/competition/j1-league  
J2 logo collection: https://www.footylogos.com/competition/j2-league  
Official J.League club composition: https://aboutj.jleague.jp/corporate/en/about_jclubs/profile_jclubs/

Club crests are trademarks of their respective owners and are used only for team identification. Review rights-holder guidance and source-site terms before any public or commercial use.
