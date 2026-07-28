# Paleidimas — nuo nulio iki gyvo puslapio

Projektas veikia ant **Cloudflare Workers su statiniais failais**
(Workers Static Assets). Anksčiau tai buvo Pages projektas; Cloudflare
naujus projektus kreipia į Workers, todėl perėjome.

Nuo pradžios iki veikiančio puslapio: **apie 15 minučių.** Programuoti
nereikia nieko.

---

## 0 dalis — pakeiskite tekstus (5 min)

| Ieškoti | Pakeisti į |
|---|---|
| `+37060000000` | jūsų numeris be tarpų, su `+370` |
| `+370 600 00000` | jūsų numeris gražiu formatu |
| `PAKEISTI-DOMENA.lt` | jūsų domenas |
| `PAKEISTI-VARDAS` | jūsų vardas arba įmonės pavadinimas |
| `PAKEISTI-IMONES-KODAS` | veiklos / įmonės kodas (privatumas.html) |
| `PAKEISTI-EL-PASTAS` | el. paštas (privatumas.html) |

Iš `renginiai/` katalogo, įrašę savo tikrus duomenis:

```bash
grep -rl 'PAKEISTI\|+37060000000' public/ \
  | xargs sed -i \
      -e 's/+37060000000/+37061234567/g' \
      -e 's/+370 600 00000/+370 612 34567/g' \
      -e 's/PAKEISTI-DOMENA\.lt/jusudomenas.lt/g' \
      -e 's/PAKEISTI-VARDAS/Jūsų Vardas/g'
```

> macOS naudokite `sed -i ''` vietoj `sed -i`.

Patikrinkite:

```bash
grep -rn 'PAKEISTI\|+37060000000' public/ || echo "Švaru."
```

**Nuotraukos** → `public/assets/img/`, žr.
[instrukciją](public/assets/img/README.md). Kol jų nėra, įrodymų sekcija
slepiasi savaime.

**Atsiliepimai** — sekcija `index.html` faile užkomentuota. Gavę tikrą,
atkomentuokite ir pakeiskite tekstą. Išgalvoto rašyti negalima.

---

## 1 dalis — Workers projektas iš Git (5 min)

[Cloudflare skydelis](https://dash.cloudflare.com) → **Compute (Workers)**
→ **Create** → **Import a repository** → pasirinkite šį repozitoriumą.

| Laukas | Reikšmė |
|---|---|
| **Root directory** | **`renginiai`** |
| Build command | *(palikti tuščią)* |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |

> `Root directory` nurodyti **būtina**. Be jo `wrangler deploy` paleidžiamas
> repozitoriumo šaknyje, kur nėra nei `wrangler.toml`, nei `public/`, ir
> diegimas krenta su klaida
> *„Could not detect a directory containing static files"*.

**Save and Deploy.** Gausite adresą
`https://renginiai.<subdomenas>.workers.dev`.

---

## 2 dalis — duomenų bazė

Bazė **jau sukurta** ir lentelė paruošta:

```
renginiai-leads · 4008592d-ac1d-40f2-b8a4-45b01090c27e · EEUR
```

`wrangler.toml` jau turi šį `database_id`, todėl **skydelyje nieko
prijunginėti nereikia** — Workers projektuose bindingai pritaikomi iš
konfigūracijos failo diegimo metu. Tai skiriasi nuo Pages, kur bindingą
reikėdavo pridėti atskirai rankomis ir kur to praleidimas buvo
dažniausia klaida.

Naujam funnel'iui bazė kuriama taip:

```bash
npx wrangler d1 create <vardas>
npx wrangler d1 execute <vardas> --remote --file=./schema.sql
```

Patikrinti, kad lentelė yra:

```bash
npx wrangler d1 execute renginiai-leads --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 3 dalis — pranešimai į telefoną (5 min, neprivaloma)

Kad apie kiekvieną užklausą sužinotumėte per kelias sekundes. Tai
tiesiogiai keičia, kiek žmonių atsilieps, kai perskambinsite.

1. Telegram programoje raskite **@BotFather** → `/newbot` → gausite token
2. **Parašykite savo naujam botui bet kokią žinutę** — be to jis negalės
   jums rašyti
3. Naršyklėje atidarykite `https://api.telegram.org/bot<TOKEN>/getUpdates`
   ir raskite `"chat":{"id":123456789}`
4. Skydelyje: **Workers projektas → Settings → Variables and Secrets →
   Add → Secret**

| Kintamasis | Reikšmė |
|---|---|
| `TELEGRAM_BOT_TOKEN` | jūsų token |
| `TELEGRAM_CHAT_ID` | jūsų chat id |
| `LEADS_TOKEN` | sugalvotas ilgas slaptažodis |

Be šių kintamųjų viskas veikia — tiesiog be pranešimų, o kontaktų
eksportas lieka išjungtas.

---

## 4 dalis — domenas

**Workers projektas → Settings → Domains & Routes → Add → Custom domain.**

Jei domenas jau Cloudflare, įrašai sukuriami automatiškai. HTTPS
sertifikatas išduodamas per kelias minutes.

Prijungę domeną **nuimkite demo režimą** `public/index.html` faile:
ištrinkite `<meta name="robots" content="noindex, nofollow">` eilutę ir
atkomentuokite `<link rel="canonical">`.

---

## 5 dalis — patikrinkite

1. Atidarykite puslapį telefone
2. Paspauskite **Skambinti** — turi atsidaryti skambinimo langas
3. Užpildykite formą savo tikru numeriu
4. Turi permesti į `/aciu`
5. Turi ateiti pranešimas į Telegram, jei jį nustatėte
6. Patikrinkite bazę:

```bash
npx wrangler d1 execute renginiai-leads --remote \
  --command "SELECT id, name, phone, created_at FROM leads ORDER BY id DESC LIMIT 5;"
```

---

## Kontaktų sąrašo atsisiuntimas

```
https://jusudomenas.lt/api/leads?token=JUSU_LEADS_TOKEN&format=csv
```

Atsisiųs `kontaktai.csv`, kurį Excel atidaro su veikiančiomis
lietuviškomis raidėmis. Be `format=csv` gausite JSON.

> Ši nuoroda atveria visų klientų telefonus. Nesidalinkite ja.

---

## Testavimas kompiuteryje

```bash
cd renginiai
npx wrangler dev --port 8810
npx wrangler d1 execute renginiai-leads --local --file=./schema.sql
```

Vietiniams slaptažodžiams naudokite `.dev.vars` failą — jis yra
`.gitignore` sąraše — o ne `wrangler.toml`.

Paleidimo žurnale turi matytis abu bindingai:

```
env.DB (renginiai-leads)   D1 Database   local
env.ASSETS                 Assets        local
```

---

## Kai kas nors neveikia

| Požymis | Priežastis | Sprendimas |
|---|---|---|
| `Could not detect a directory containing static files` | Nenurodytas `Root directory` | 1 dalis |
| Forma rodo „Nepavyko išsiųsti", konsolėje 404 | Tas pats | 1 dalis |
| „Serverio konfigūracijos klaida" | `database_id` neįrašytas į `wrangler.toml` | 2 dalis |
| Forma veikia, bet bazė tuščia | Nepaleistas `schema.sql` | 2 dalis |
| Pranešimai neateina | Botui neparašyta pirma žinutė | 3 dalis |
| `/api/leads` grąžina 503 | Nenustatytas `LEADS_TOKEN` | 3 dalis |
| Lietuviškos raidės CSV sugadintos | Excel atidarytas per „Import" | Atidarykite failą dvigubu paspaudimu |

Platesnis sąrašas su tiksliomis klaidų žinutėmis:
[`../docs/CLOUDFLARE-KLAIDOS.md`](../docs/CLOUDFLARE-KLAIDOS.md)
