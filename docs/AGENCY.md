# Agentūros sistema

Šis dokumentas yra tikrasis turtas. Konkretus puslapis parduoda vieną
klientą, o sistema leidžia kitą pastatyti per dieną vietoj savaitės.

---

## 1. Ką agentūra parduoda

Ne „svetainę“. Puslapį, kuris paverčia reklamos paspaudimą pokalbiu.
Skirtumas svarbus, nes nustato, ką matuojame: ne dizaino grožį, o
kiek žmonių paskambino.

Kiekvienas funnel'is turi **vieną** pagrindinį veiksmą. Renginių
puslapyje tai skambutis. Ne du veiksmai, ne trys. Antrinis kelias
(forma) egzistuoja tik tiems, kam skambinti nepatogu, ir niekada
nekonkuruoja su pirmuoju vizualiai.

---

## 2. Kodo architektūra

```
funnels/
├── _shared/
│   └── core.css              ← ETALONAS. Redaguojama TIK čia
└── <kliento-vardas>/
    ├── public/
    │   ├── index.html
    │   ├── aciu.html
    │   ├── privatumas.html
    │   ├── _headers
    │   └── assets/
    │       ├── css/
    │       │   ├── core.css          ← kopija iš _shared
    │       │   └── theme-<vardas>.css ← VIENINTELIS kliento failas
    │       ├── js/app.js
    │       └── img/
    ├── functions/api/
    │   ├── lead.js
    │   └── leads.js
    ├── schema.sql
    ├── wrangler.toml
    └── DEPLOY.md
```

### Dviejų sluoksnių taisyklė

`core.css` **niekada** neturi spalvų ir šriftų. Jis turi tik išdėstymą
ir komponentus, kurie naudoja kintamuosius. `theme-*.css` turi **tik**
kintamuosius ir kelias kliento specifines detales.

Todėl naujas klientas = naujas temos failas, o ne naujas puslapis.

Jei kada nors tenka į `core.css` įrašyti spalvą — sustokite. Reiškia,
kad trūksta kintamojo. Pridėkite jį prie temos kontrakto žemiau.

### Temos kontraktas

Kiekvienas `theme-*.css` privalo apibrėžti visus šiuos kintamuosius:

```css
--paper --paper-warm --ink --ink-soft --ink-mute
--accent --accent-dark --accent-tint --line
--success --danger
--font-display --font-body --radius
```

Praleistas kintamasis nesugriaus puslapio garsiai — jis tiesiog liks
be spalvos. Todėl kopijuokite kontraktą, o ne rašykite iš atminties.

### CSS krovimo eilė

```html
<link rel="stylesheet" href="/assets/css/theme-....css">  <!-- PIRMA -->
<link rel="stylesheet" href="/assets/css/core.css">       <!-- ANTRA -->
```

Sukeitus vietomis puslapis liks be stilių. Tema apibrėžia kintamuosius,
kuriuos `core.css` naudoja.

### Kai keičiate `core.css`

Redaguojate `_shared/core.css`, paskui kopijuojate į kiekvieną
funnel'į:

```bash
for f in */public/assets/css/core.css; do
  cp _shared/core.css "$f"
done
```

Kopijos, o ne bendras failas, sąmoningai: kiekvienas funnel'is diegiamas
atskirai ir turi likti savarankiškas. Vieno kliento puslapis niekada
neturi sugesti dėl kito kliento pakeitimo.

---

## 3. Puslapio anatomija

Eilė nėra atsitiktinė. Kiekviena sekcija atlieka darbą, ir praleista
sekcija palieka skylę, kurią skaitytojas užpildo abejone.

| # | Sekcija | Darbas |
|---|---|---|
| 1 | Hero | Kam skirta ir koks pagrindinis pažadas. CTA matomas iš karto |
| 2 | Prielaidos atidarymas | „Jei skaitote šį puslapį, spėju, kad…“ — skaitytojas atpažįsta save |
| 3 | Tikroji baimė | Įvardijama jo problema jo žodžiais, dar nieko neprašant |
| 4 | Kaip tai veikia | Mechanizmas, 3 žingsniai. „Wow, ne how“ |
| 5 | Skepticizmas | Abejonė įvardijama garsiai ir atsakoma patikrinamu dalyku |
| 6 | Įrodymas | Tikros nuotraukos. Rodyti, ne pasakoti |
| 7 | Gaunate / nebereikia | Dvi skiltys: ko nori, be to, ko nekenčia |
| 8 | Kvalifikacijos blokai | 3–5 skirtingi avatarai. Variklis (žr. 4 skyrių) |
| 9 | Ateities vaizdas | „Įsivaizduokite…“ |
| 10 | Atsiliepimai | Tik tikri. Kitaip sekcijos nėra |
| 11 | DUK | 5 tikros abejonės, ne užpildas |
| 12 | Paskutinis CTA | Tas pats veiksmas, ramiai |

---

## 4. Kvalifikacijos blokai

Didžiausio svorio elementas ir dažniausiai praleidžiamas.

Vietoj vienos problemos sekcijos vienam avatarui, puslagis paleidžia
3–5 atskirus blokus, kiekvieną kitam žmogui. Skaitytojas, kuris nėra
pirmas avataras, nenustoja skaityti, nes antras blokas gali būti apie
jį. Su kiekvienu bloku kritimo tikimybė mažėja.

Bloko forma:

1. **Klausimas antraštėje** — antras asmuo, viena konkreti įstrigimo
   būsena, baigiasi klaustuku
2. **Situacija** — kodėl būtent čia vakarai sugriūva
3. **Diagnozė** — kas trūksta. **Privalo skambėti mažai ir pataisomai.**
   „Trūksta vieno žmogaus, kuris laiko laike“ veikia.
   „Reikia viską perdaryti“ atbaido
4. **Kainos eilutė** — ta pati, pažodžiui, po kiekvienu bloku

Kainos eilutė renginių puslapyje:

> *Kiek jums kainuoja vakaras, kurio svečiai neprisimins?*

Kartojimas ir yra priemonė. Perskaičius ketvirtą kartą ji turi
darytis nepatogesnė, ne erzinanti. Jei erzina — trumpinkite.

Blokų eilė: **pagal rinkos dydį, didžiausias pirmas.** Ne pagal geriausią
rezultatą.

---

## 5. Kainos taisyklė

Puslapiuose, kur tikslas yra skambutis, **kaina nerašoma.**

Priežastis ne gudrybė. Renginio kaina realiai priklauso nuo trukmės,
vietos ir apimties, todėl bet koks skaičius puslapyje būtų neteisingas
daliai skaitytojų. Žmogus, pamatęs netinkantį skaičių, išeina, nors
jam būtų tikęs kitas variantas.

DUK klausimas „kiek kainuoja“ atsakomas atvirai — paaiškinama, **kodėl**
kainos nėra, ir pažadama pasakyti ją per pokalbį iš karto. Vengimas
atsakyti erzina labiau nei pati kaina.

---

## 6. Sąžiningumo ribos

Šitos taisyklės nėra estetika. Jos yra tai, kas skiria agentūrą, kurią
rekomenduoja, nuo tos, kurią uždaro.

- **Jokių išgalvotų atsiliepimų.** Nei vardų, nei citatų. Kol tikro
  nėra, sekcijos nėra
- **Jokių išgalvotų skaičių.** „500 renginių“, „98 % patenkintų“ —
  tik jei tai tiesa ir pagrindžiama
- **Jokio netikro skubinimo.** Skaitiklis, kuris kas dieną prasideda iš
  naujo, pastebimas ir kainuoja daugiau, nei duoda
- **Jokio nuotraukų banko vietoj įrodymo.** Geriau punktyrinis rėmelis
  su užrašu „vieta nuotraukai“ negu svetimas žmogus svetimoje salėje
- **Kainos inkaras tik tikras.** Perbraukta „buvo 2000 €“ turi būti
  kaina, kuria realiai buvo prekiaujama

Puslapis su tuščiu atsiliepimų bloku konvertuoja prasčiau nei su tikru.
Bet puslapis su išgalvotu atsiliepimu konvertuoja gerai lygiai iki tos
dienos, kai kas nors paklausia.

---

## 7. Naujas funnel'is per 6 žingsnius

```bash
cp -r renginiai funnels/naujas-klientas
cd funnels/naujas-klientas
rm -rf public/assets/img/*.jpg
```

1. `public/assets/css/theme-renginiai.css` → pervadinti į
   `theme-naujas.css`, perrašyti kintamuosius, atnaujinti nuorodas
   trijuose HTML failuose
2. `public/index.html` → perrašyti tekstą pagal 3 skyriaus anatomiją
3. `wrangler.toml` → naujas `name` ir nauja D1 bazė
4. `DEPLOY.md` → atnaujinti bazės pavadinimą
5. Nuotraukos į `public/assets/img/`
6. Naujas Cloudflare Pages projektas, `Root directory` = `funnels/naujas-klientas`

Kas **nesikeičia**: `core.css`, `app.js`, `functions/`, `schema.sql`,
`_headers`. Tai ir yra sutaupytas laikas.

---

## 8. Ką matuoti

Minimalus rinkinys, be analitikos sistemų:

- **Skambučiai.** `data-track="call-hero|call-mid|call-sticky|call-final"`
  atributai jau yra ant kiekvieno skambinimo mygtuko. Prijungus bet kokią
  analitiką iš karto matysis, kuri puslapio vieta duoda skambučius
- **Formos užklausos.** Skaičiuojamos D1 bazėje su `created_at`
- **Santykis.** Kiek žmonių skambina prieš tiek, kiek palieka numerį.
  Jei formos laimi, skambinimo mygtukas per silpnas arba per žemai

Prieš keičiant tekstą verta žinoti, kuris CTA veikia. Dažniausiai
problema ne kopija, o tai, kad skambinimo mygtukas nematomas telefone.

---

## 9. Žurnalas

Po kiekvieno gyvo puslapio čia įrašoma, kas pasiteisino. Sistema
vertinga tik tiek, kiek mokosi.

```
### [Klientas] — [data]
Kas keista:
Rezultatas:
Išvada:
```

*(kol kas tuščia — pirmas įrašas po pirmo gyvo puslapio)*
