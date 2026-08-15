# agenturos-funnel — darbo konvencijos

Šis failas skaitomas automatiškai sesijos pradžioje. Tikslas — nereikėtų iš naujo
aiškinti tų pačių dalykų kiekvieną kartą.

## Copywriting formatas

- **Sakinys — atskira eilutė.** Daugiau nei vieno sakinio pastraipose (hero lede,
  kortelės tekstas) kiekvienas sakinys eina savo `<br>` eilute. Geresnis
  skaitomumas ir kompiuteryje, ir telefone. Netaikoma trumpoms (1 sakinio)
  pastraidoms.
- **Faktas/citata su šaltiniu:** citata kabutėse „...", šaltinis atskiroje
  eilutėje skliaustuose `(Šaltinis)` — BE papildomo paaiškinimo sakinio tipo
  „Dažnai cituojama...". Stilius: `.pullquote` (italic serif, be rėmelio,
  centruota) + `.fact-source` po ja — NE bordered card (`.fact-box` išimta iš
  `core.css`, buvo per sunki vizualiai). Tarpas po `.fact-source` iki
  sekančio bloko (CTA ir pan.) — **~40px, ne ~25px**: 25px šalia stambių
  mygtukų atrodo per glausta.
- **Jokių sugalvotų skaičių, atsiliepimų ar citatų.** Tik patikrinami faktai su
  nurodytu šaltiniu, arba realūs, jau egzistuojantys puslapio faktai (pvz.
  „vienai dienai — vienas renginys"). Žr. FAQ „Kodėl puslapyje nėra
  atsiliepimų?" — tai sąmoninga pozicija, ne aplaidumas.
- **Akcentas pabraukimu:** `.hl` (bold + accent spalva) NĖRA pabrauktas — jis
  naudojamas 4+ vietose svetainėje kaip antraščių akcentas, pabraukimas ten
  būtų per sunkus. Vietoj to: `.hl-u` — pabraukimas TIK vienam žodžiui h1
  viduje (pvz. „tampa"), `.accent-link` — pabraukta fraze pastraipoje (lengvesnė
  už `.hl`, skirta trumpoms 2-3 žodžių frazėms kaip „viena kryptis").

## Kai naudotojas sako „dar neatsinaujino"

Pirmiausia patikrinti `git log -1 -- <failas>` ir `grep` patį pakeitimą repo —
jei jis TEN yra (push'as pavyko), problema greičiausiai naršyklės ar
Cloudflare edge cache, NE kodas. Nekartoti redagavimo aklai. Paaiškinti
naudotojui, kad kodas patvirtintas teisingas, ir paprašyti hard refresh
(Ctrl+Shift+R) arba inkognito lango prieš darant bet kokius papildomus
pakeitimus. Šitas scenarijus jau pasikartojo (žr. FAKTAS-šalia-juostos
epizodą) — tikėtina pasikartos ir ateityje su šiuo projektu.

## Darbo eiga keičiant kodą

1. Šaka iš `main`, redaguoti, tada **Playwright screenshot 390px ir 1440px**
   prieš pushinant — ypač hero/formos pakeitimams (žr. paskutines sesijas dėl
   šablono: `python3 -m http.server` + Playwright su
   `executablePath: '/opt/pw-browsers/chromium'`).
2. HTML tag-balance patikra inline Python `html.parser` skriptu prieš commit'ą.
3. Smulkūs, dažni commit'ai — ne vienas didelis. Lengviau atsekti, jei kažkas
   nutrūksta pusiaukelėje.
4. Merge į `main` → push → Cloudflare deploy'ina automatiškai (git-based CI,
   jau sukonfigūruota). Deploy'o statuso tiesiogiai patikrinti negaliu (nėra
   Cloudflare MCP prieigos šioje aplinkoje) — patvirtinimas ateina iš
   naudotojo arba iš kito `git log` po kurio laiko.

## D1 schema pakeitimai — VISADA kritinis žingsnis

Kai keičiami `renginiai/schema.sql` stulpeliai (nauji laukai formoje ir pan.):
1. Sukurti `renginiai/migrations/000N_*.sql` su `ALTER TABLE`.
2. **PRIEŠ** mergini/deploy'ini kodą, kuris rašo į naujus stulpelius — migracija
   turi būti paleista rankiniu būdu (`wrangler d1 execute ... --remote` arba
   per Cloudflare skydelio D1 Console). Priešingu atveju gyva forma sulūš
   realiems klientams (`INSERT` į neegzistuojantį stulpelį).
3. Niekada nemerginti/nepushinti tokio kodo, kol naudotojas nepatvirtino, kad
   migracija jau paleista.

## Kai naudotojas atsiunčia dizaino nuorodą (screenshot/mockup)

Tai reiškia „padaryk TIKSLIAI taip", ne bendrą įkvėpimą. Atkurti:
elementų TVARKĄ (ne tik tekstą), stilių (rėmelis/be rėmelio, šriftas), o ne
tik spalvas. Po pakeitimo — savas Playwright screenshot palyginimui prieš
pushinant, nes smulkūs neatitikimai (pvz. neteisinga elementų tvarka)
lengvai praslysta be vizualaus patikrinimo.

## Headline užklausos (`/headline-creator` stiliaus)

- Skill'o „effortless mechanism" formulė (laiko suspaudimas + rezultatas +
  skuba) parašyta Arminui savo AI/no-code verslui — Andriaus sąžiningam
  asmeniniam brandui ji iš prigimties netinka (nes žada greitį, kurio realiai
  nėra: pati šventė trunka valandas, ne minutes). **Vis tiek pareiga:
  paminėti šitą neatitikimą VIENĄ kartą aiškiai** (kaip padariau su
  „7 minučių" pavyzdžiu), pasiūlyti sąžiningą alternatyvą su realiu skaičiumi
  (pvz. jau įrodytu „20 minučių" pirmo pokalbio faktu). **Jei naudotojas,
  išgirdęs pastabą, vis tiek nurodo tikslų tekstą antrą kartą (ar duoda
  mockup'ą su konkrečiu skaičiumi) — įgyvendinti tiksliai kaip paprašyta,
  nebeblokuoti trečią kartą.** Tai jo verslo rinkodaros tekstas, ne faktinis
  paslaugos aprašymas; sprendimas jam priklauso po to, kai jis informuotas.
- **Angliškas žodis lietuviškame tekste (pvz. „7 minutes" vietoj
  „7 minučių") — beveik visada telefono autopataisos artefaktas, ne
  sąmoningas pasirinkimas.** Tyliai ištaisyti į taisyklingą lietuvių kalbą,
  nepaklausus — nekeisti nieko kito prasmėje.
- **`&nbsp;` tarp skaičiaus ir vieneto** (pvz. `7&nbsp;minučių`) ir **aplink
  ilguosius brūkšnelius** (`—`), kad jie neišsilaužytų atskirai per eilutės
  pabaigą/pradžią telefone. Patikrinti Playwright screenshot'u 390px prieš
  pushinant — akimis matomas skirtumas tarp „7" vienišo eilutės gale ir
  „7 minučių" kartu.

## Kitos pastabos

- Prekės ženklas asmeninis („Vedėjas Andrius"), pirmuoju asmeniu / pora
  daugiskaitoje tik ten, kur kalbama apie vedėją+DJ kartu.
- CSP: `script-src 'self'` be `unsafe-inline` — bet koks naujas trečios šalies
  script'as (analytics ir pan.) turi būti perkeltas į `/assets/js/*.js`
  same-origin failą, ne inline. Web Worker'iams (pvz. Clarity) reikia
  atskiro `worker-src 'self' blob:'` — vien `script-src` neužtenka.
- Klaidų/gotchas žurnalas: `docs/CLOUDFLARE-KLAIDOS.md`.
