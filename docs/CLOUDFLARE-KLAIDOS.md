# Cloudflare Pages + D1 — klaidos, patikrintos praktiškai

Kiekviena klaida čia buvo realiai pataikyta statant `renginiai`
ir kiekvienas sprendimas patikrintas, kad veikia. Perskaitykite prieš
statydami naują funnel'į — tai pigiau negu derinti iš naujo.

---

## CF-011 · `Could not detect a directory containing static files`

**Klaida diegimo žurnale**
```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Could not detect a directory containing static files
   (e.g. html, css and js) for the project
Failed: error occurred while running deploy command
```

**Kada** Pirmas diegimas iš Git, kai funnel'is guli pakatalogyje
(`renginiai/`), o ne repozitoriumo šaknyje.

**Priežastis** Dvi atskiros priežastys, kurios pasitaiko kartu:

1. **Nenurodytas `Root directory`.** `wrangler deploy` paleidžiamas
   repozitoriumo šaknyje, kur nėra nei `wrangler.toml`, nei `public/`,
   todėl wrangler bando spėti statinių failų katalogą ir nespėja.
2. **Projektas sukurtas kaip Workers, o kodas rašytas Pages.** Požymis
   žurnale vienareikšmis: **Pages projektuose nėra „deploy command"** —
   jie naudoja build command ir output directory. Eilutė
   `Executing user deploy command: npx wrangler deploy` reiškia, kad tai
   Workers Builds.

**Sprendimas** Nustatyti `Root directory` = kliento katalogas. Jei kodas
dar Pages formato, jį reikia konvertuoti (žr. CF-012).

**Prevencija** Nuspręsti dėl platformos **prieš** rašant backend'ą.
Cloudflare naujus projektus kreipia į Workers, todėl naujiems
funnel'iams Pages rinktis nebeverta.

**Žymos:** `cloudflare` `workers` `svarbumas: aukštas`

---

## CF-012 · Perėjimas nuo Pages Functions prie Workers Static Assets

**Kada** Kodas parašytas Pages formatu (`functions/` katalogas,
`pages_build_output_dir`), o projektas turi veikti kaip Workers.

**Ką reikia pakeisti**

| Pages | Workers |
|---|---|
| `pages_build_output_dir = "public"` | `[assets] directory = "./public"` |
| `functions/api/lead.js` → auto maršrutas | `main = "src/index.js"` + maršrutai kode |
| `export async function onRequestPost({ request, env })` | `export async function handleLead(request, env)` |
| Bindingas kartojamas skydelyje rankomis | Bindingas pritaikomas iš `wrangler.toml` |

Maršrutizatorius:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') return handleLead(request, env);
    if (url.pathname.startsWith('/api/')) return json({ error: 'Nerasta' }, 404);
    return env.ASSETS.fetch(request);
  },
};
```

**Kas NEsikeičia** `_headers` ir `_redirects` failai Workers Static
Assets palaikomi natyviai, jei guli statinių failų kataloge. D1 kodas
identiškas.

**Dvi smulkmenos, kurios pastebimos tik ištestavus**

1. Workers automatiškai nukreipia `/aciu.html` → `/aciu` (307). Veikia,
   bet formos kelyje atsiranda nereikalingas šuolis — nuorodas ir
   `window.location.href` verta rašyti be `.html`.
2. Nežinomas `/api/*` kelias be atskiro patikrinimo grąžintų HTML
   puslapį, ir naršyklės `response.json()` suklustų su neaiškia klaida.
   Todėl `/api/` prefiksui grąžinamas JSON 404.

**Privalumas, dėl kurio verta pereiti** Dingsta CF-003 klasės klaida:
Workers projektuose bindingo skydelyje kartoti nereikia, todėl
„lokaliai veikia, gyvai ne" situacija nebeatsiranda.

**Žymos:** `cloudflare` `workers` `migracija` `svarbumas: aukštas`

---

## CF-001 · `no such table: leads` nors schema paleista

**Klaida serverio žurnale**
```
D1_ERROR: no such table: leads: SQLITE_ERROR
```
Užklausa grąžina `{"error":"Nepavyko išsaugoti"}` su 500.

**Kada** Testuojant lokaliai su `wrangler pages dev`, kai `schema.sql`
jau paleista su `wrangler d1 execute ... --local`.

**Priežastis** `wrangler pages dev --d1 DB=vardas` sukuria **kitą**
lokalią bazę negu ta, kurią `wrangler d1 execute --local` randa pagal
`wrangler.toml`. Diske atsiranda du atskiri `.sqlite` failai:

```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash-a>.sqlite
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash-b>.sqlite
```

**Sprendimas** Nenaudokite `--d1` vėliavos. Kai `wrangler.toml` turi
`pages_build_output_dir` ir `[[d1_databases]]`, bindingas paimamas
automatiškai ir abi komandos rodo į tą patį failą:

```bash
npx wrangler pages dev --port 8799
```

Patikrinimas — paleidimo žurnale turi būti be `local-` priešdėlio:
```
env.DB (renginiai-leads)    D1 Database    local
```

**Prevencija** Prieš testuojant visada perskaitykite bindingų lentelę
wrangler paleidimo žurnale. Ji parodo tikrąjį bazės pavadinimą.

**Žymos:** `cloudflare` `d1` `svarbumas: aukštas`

---

## CF-002 · Forma grąžina 404, nors puslapis veikia

> **Pages laikų įrašas.** Perėjus prie Workers (CF-012) simptomas tas
> pats, bet priežastis aprašyta CF-011.

**Klaida naršyklės konsolėje**
```
POST https://domenas.lt/api/lead 404 (Not Found)
```

**Kada** Pirmas diegimas, kai funnel'is guli pakatalogyje
(`renginiai`), o ne repozitoriumo šaknyje.

**Priežastis** Cloudflare Pages ieško `functions/` katalogo **projekto
šaknyje**. Jei `Root directory` nenurodytas, šaknis yra repozitoriumo
šaknis, kur `functions/` nėra. Statiniai failai susikompiliuoja, todėl
puslapis atrodo tvarkingas ir klaida pastebima tik bandant siųsti formą.

**Sprendimas** Pages projekto nustatymuose:

| Laukas | Reikšmė |
|---|---|
| Root directory | `renginiai` |
| Build output directory | `public` |
| Build command | *(tuščia)* |

Po pakeitimo **Retry deployment** — seni diegimai neperskaičiuojami.

**Prevencija** Testuokite formą iš karto po pirmo diegimo, ne prieš pat
reklamos paleidimą.

**Žymos:** `cloudflare` `pages` `svarbumas: aukštas`

---

## CF-003 · „Serverio konfigūracijos klaida“ gyvame puslapyje

> **Pages laikų įrašas.** Workers projektuose ši klaida nebeatsiranda —
> bindingas pritaikomas iš `wrangler.toml`, o ne rankomis skydelyje.

**Kada** Lokaliai viskas veikia, gyvai forma neišsiunčia.

**Priežastis** `wrangler.toml` bindingas galioja **tik lokaliai**.
Gyvame Pages projekte bindingas pridedamas atskirai skydelyje, ir šis
žingsnis praleidžiamas dažniausiai iš visų.

**Sprendimas** Pages → Settings → Bindings → Add → D1 database:

| Laukas | Reikšmė |
|---|---|
| Variable name | `DB` |
| D1 database | jūsų bazė |

Pridėti **ir Production, ir Preview**. Paskui Retry deployment.

**Prevencija** Kode tikrinama `if (!env.DB)` ir rašoma aiški žinutė į
žurnalą. Be šio patikrinimo klaida būtų beprasmis 500.

**Žymos:** `cloudflare` `d1` `svarbumas: aukštas`

---

## CF-004 · Lietuviškos raidės sugadintos CSV faile

**Požymis** `Rūta Ąžuolaitė` Excel'yje virsta `RÅ«ta Å½uolaitÄ—`.

**Priežastis** Excel nelaiko UTF-8 numatytuoju CSV koduotės variantu ir
be BOM žymos spėja pagal sistemos lokalę.

**Sprendimas** CSV pradžioje siųsti UTF-8 BOM:

```js
return new Response('﻿' + rows.join('\r\n'), {
  headers: { 'Content-Type': 'text/csv; charset=utf-8' },
});
```

Eilučių pabaigos taip pat turi būti `\r\n`, ne `\n`.

**Prevencija** Bet kuriame eksporte lietuviškiems duomenims BOM yra
privalomas, ne pasirinktinis.

**Žymos:** `cloudflare` `csv` `lokalizacija` `svarbumas: vidutinis`

---

## CF-005 · CSV eksportas kaip saugumo skylė

**Problema** Du dalykai viename endpointe:

1. Be autorizacijos `/api/leads` paviešina visus klientų telefonus
2. Kliento įvestas tekstas, prasidedantis `=` arba `@`, Excel'yje
   vykdomas kaip formulė (CSV injection)

**Sprendimas**

Endpoint'as išjungiamas, jei nėra slaptažodžio — saugiau sugesti negu
tyliai veikti atvirai:

```js
if (!env.LEADS_TOKEN) return new Response('...', { status: 503 });
```

Formulės neutralizuojamos, bet telefonai paliekami švarūs:

```js
const PHONE_SHAPE = /^[+\-]?[\d\s()\-.]{6,}$/;
const risky = /^[=@]/.test(s) || (/^[+\-]/.test(s) && !PHONE_SHAPE.test(s));
```

**Kodėl ne paprasčiau** Įprastas variantas „apostrofas prieš `=+-@`“
uždeda apostrofą ant **kiekvieno** `+370...` numerio, ir sąrašas tampa
nepatogus naudoti kasdien. Tikrinama numerio forma tai išsprendžia
neprarandant apsaugos.

**Žymos:** `saugumas` `csv` `svarbumas: aukštas`

---

## CF-006 · CSP blokuoja `onerror` atributus

**Klaida**
```
Refused to execute inline event handler because it violates
the following Content Security Policy directive: "script-src 'self'"
```

**Kada** Pridėjus griežtą CSP į `_headers`, kai HTML naudoja
`onerror="..."` arba `onclick="..."` atributus.

**Priežastis** Inline įvykių atributai yra inline skriptai. Jiems
reikia `script-src 'unsafe-inline'`, o tai panaikina didžiąją dalį CSP
naudos.

**Sprendimas** Perkelti į išorinį failą:

```js
document.querySelectorAll('.photo img').forEach(img => {
  img.addEventListener('error', handleFail);
  if (img.complete && img.naturalWidth === 0) handleFail();
});
```

Antra eilutė būtina — su `defer` skriptas paleidžiamas jau po to, kai
kai kurie paveikslėliai nepavyko, ir `error` įvykis nebepasikartoja.

`style-src 'unsafe-inline'` palikti galima: inline stiliai kur kas
mažiau pavojingi nei skriptai.

**Žymos:** `saugumas` `csp` `svarbumas: vidutinis`

---

## CF-007 · Tingiai kraunami paveikslėliai neparodo atsarginio varianto

**Požymis** Testas rodo 0 vietų nuotraukoms, nors nė vienos nuotraukos
nėra įkelta.

**Priežastis** `loading="lazy"` paveikslėliai, esantys žemiau ekrano,
apskritai nepradedami krauti, todėl `error` įvykis neįvyksta, kol
vartotojas nenuslenka iki jų.

**Sprendimas** Klaida ne kode — klaida teste. Prieš tikrinant reikia
nuslinkti:

```js
await page.locator('.photo-grid').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
```

**Prevencija** Bet ką, kas krauna tingiai, testuokite tik nuslinkę.
Priešingu atveju gaunamas klaidingas „neveikia“ ir taisomas veikiantis
kodas.

**Žymos:** `testavimas` `playwright` `svarbumas: žemas`

---

## CF-008 · Playwright neranda naršyklės

**Klaida**
```
browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1234/...
```

**Priežastis** `npm install playwright` įdiegia naujausią versiją,
kuri tikisi kitos naršyklės kompiliacijos negu iš anksto įdiegta
aplinkoje.

**Sprendimas** Nurodyti kelią tiesiogiai ir nediegti naršyklių iš naujo:

```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright
```

**Žymos:** `testavimas` `playwright` `svarbumas: žemas`

---

## CF-009 · `pkill` nutraukia patį apvalkalą

**Požymis** Komanda baigiasi kodu 144 ir dingsta visa išvestis.

**Priežastis** `pkill -f "wrangler pages dev"` pagal šabloną pataiko ir
į savo paties apvalkalo procesą.

**Sprendimas** Testuojant paleisti kitą portą, o ne žudyti seną procesą:

```bash
nohup npx wrangler pages dev --port 8802 > /tmp/w.log 2>&1 &
```

**Žymos:** `apvalkalas` `svarbumas: žemas`

---

## CF-010 · Auksinė spalva nepraeina kontrasto reikalavimų

**Problema** Balta ant „gražaus“ aukso `#BE8C2C` duoda 3.0:1 — WCAG AA
reikalauja 4.5:1. Tai pagrindinis skambinimo mygtukas, t. y. vienintelis
elementas, kuris niekada neturi būti sunkiai įskaitomas.

**Priežastis** Auksas yra šviesus atspalvis. Kad ant jo tilptų balta,
jį reikia patamsinti daug labiau, negu atrodo iš akies.

**Sprendimas** `#9A6E1D` duoda 4.54:1 ir išlieka šiltas.

Tikrinti reikia **abu** fonus — reikšmė, praeinanti ant `--paper`, gali
kristi ant `--paper-warm`, o būtent ten dažniausiai sėdi pilkas tekstas.

**Prevencija** Skaičiuoti kontrastą prieš tvirtinant paletę, ne po to.
Skriptas: `_shared/contrast-check.mjs`.

**Žymos:** `dizainas` `prieinamumas` `svarbumas: vidutinis`
