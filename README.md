# Funnels

Agentūros funnel'ių platforma. Kiekvienas kliento katalogas yra
savarankiškas, atskirai diegiamas Cloudflare Pages projektas.

```
├── _shared/            bendra sistema (etalonas, nediegiamas)
│   ├── core.css        komponentų sluoksnis be spalvų
│   └── contrast-check.mjs
├── docs/               agentūros dokumentacija
└── renginiai/          #1 — renginių vedėjas + DJ (LT)
```

## Nuo ko pradėti

| Noriu… | Skaityti |
|---|---|
| paleisti renginių puslapį gyvai | [`renginiai/DEPLOY.md`](renginiai/DEPLOY.md) |
| suprasti sistemą ir statyti naują funnel'į | [`docs/AGENCY.md`](docs/AGENCY.md) |
| išspręsti klaidą | [`docs/CLOUDFLARE-KLAIDOS.md`](docs/CLOUDFLARE-KLAIDOS.md) |

## Cloudflare nustatymai

Kiekvienas funnel'is jungiamas kaip **atskiras Workers projektas** iš to
paties repozitoriumo (Compute → Create → Import a repository):

| Laukas | Reikšmė |
|---|---|
| **Root directory** | kliento katalogas, pvz. `renginiai` |
| Build command | *(tuščia)* |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |

`Root directory` be kliento katalogo reiškia, kad `wrangler deploy`
paleidžiamas repozitoriumo šaknyje, kur nėra nei `wrangler.toml`, nei
`public/`, ir diegimas krenta su *„Could not detect a directory
containing static files"*.

Platformos pasirinkimas: naudojame Workers Static Assets, o ne Pages.
Cloudflare naujus projektus kreipia būtent ten, o D1 bindingai
pritaikomi tiesiai iš `wrangler.toml` — nebereikia jų atskirai kartoti
skydelyje, o tai buvo dažniausia diegimo klaida su Pages.

## Taisyklės

1. `core.css` redaguojamas **tik** `_shared/`, paskui kopijuojamas į
   funnel'ius. Kopijos sąmoningai atskiros — vieno kliento pakeitimas
   niekada neturi sugadinti kito kliento gyvo puslapio
2. Spalvos ir šriftai gyvena tik `theme-*.css`. Jei spalva atsiduria
   `core.css` — trūksta kintamojo
3. Paletė tikrinama prieš rašant puslapį:
   `node _shared/contrast-check.mjs renginiai/public/assets/css/theme-*.css`
4. Jokių išgalvotų atsiliepimų, skaičių ar skubinimo. Priežastys —
   [`docs/AGENCY.md`](docs/AGENCY.md), 6 skyrius

## Būsena

| Funnel | Kalba | Tikslas | Būsena |
|---|---|---|---|
| `renginiai` | LT | Skambučiai | D1 bazė sukurta. Reikia: Pages projekto, telefono, vardo, nuotraukų |

Renginių D1 bazė jau egzistuoja ir lentelė paruošta:

```
renginiai-leads · 4008592d-ac1d-40f2-b8a4-45b01090c27e · EEUR
```
