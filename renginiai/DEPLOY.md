# Paleidimas — nuo nulio iki gyvo puslapio

Nuo pradžios iki veikiančio puslapio su domenu: **apie 30 minučių.**
Programuoti nereikia nieko. Kopijuokite komandas iš eilės.

Reikės: Cloudflare paskyros (nemokamos) ir domeno.

---

## 0 dalis — pakeiskite tekstus (5 min)

Puslapyje palikti aiškūs žymekliai. Pakeiskite juos VISUS prieš paleidžiant.

| Ieškoti | Pakeisti į |
|---|---|
| `+37060000000` | jūsų numeris be tarpų, su `+370` |
| `+370 600 00000` | jūsų numeris gražiu formatu |
| `PAKEISTI-DOMENA.lt` | jūsų domenas |
| `PAKEISTI-VARDAS` | jūsų vardas arba įmonės pavadinimas |
| `PAKEISTI-IMONES-KODAS` | veiklos / įmonės kodas (privatumas.html) |
| `PAKEISTI-EL-PASTAS` | el. paštas (privatumas.html) |

Greičiausias būdas — vienoje komandoje iš `renginiai/` katalogo:

```bash
grep -rl 'PAKEISTI\|+37060000000' public/ \
  | xargs sed -i \
      -e 's/+37060000000/+37061234567/g' \
      -e 's/+370 600 00000/+370 612 34567/g' \
      -e 's/PAKEISTI-DOMENA\.lt/jusudomenas.lt/g' \
      -e 's/PAKEISTI-VARDAS/Jūsų Vardas/g'
```

> Įrašykite savo tikrus duomenis vietoj pavyzdinių.
> macOS naudokite `sed -i ''` vietoj `sed -i`.

Patikrinkite, ar nieko neliko:

```bash
grep -rn 'PAKEISTI\|+37060000000' public/ || echo "Švaru."
```

**Nuotraukos:** įkelkite į `public/assets/img/` pagal
[instrukciją](public/assets/img/README.md).

**Atsiliepimai:** kol neturite tikrų, ištrinkite visą sekciją, pažymėtą
`ATSILIEPIMAS-PLACEHOLDER`, iš `public/index.html`. Punktyrinis rėmelis
gyvame puslapyje atrodo blogiau nei jo nebuvimas.

---

## 1 dalis — duomenų bazė kontaktams (5 min)

```bash
npm install -g wrangler
wrangler login
```

Sukurkite bazę:

```bash
cd renginiai
wrangler d1 create renginiai-leads
```

Komanda grąžins `database_id`. Įrašykite jį į `wrangler.toml` vietoj
`PAKEISTI-D1-DATABASE-ID`.

Sukurkite lentelę:

```bash
wrangler d1 execute renginiai-leads --remote --file=./schema.sql
```

Patikrinkite:

```bash
wrangler d1 execute renginiai-leads --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Turi matytis `leads`.

---

## 2 dalis — puslapis internete (5 min)

1. [Cloudflare skydelis](https://dash.cloudflare.com) → **Workers & Pages**
   → **Create** → **Pages** → **Connect to Git**
2. Pasirinkite šį repozitoriumą ir šaką
3. Nustatymai — **šitie trys laukai yra svarbiausi:**

   | Laukas | Reikšmė |
   |---|---|
   | Framework preset | `None` |
   | Build command | *(palikti tuščią)* |
   | Build output directory | `public` |
   | **Root directory** | `renginiai` |

   > `Root directory` nurodyti **būtina**. Be jo Cloudflare ieškos
   > `functions/` katalogo repozitoriumo šaknyje, jo neras, ir forma
   > grąžins 404 — nors puslapis atrodys puikiai.

4. **Save and Deploy**

---

## 3 dalis — prijunkite bazę prie puslapio (2 min)

Tai atskiras žingsnis nuo `wrangler.toml`, ir jį praleisti lengviausia.

**Pages projektas → Settings → Bindings → Add → D1 database**

| Laukas | Reikšmė |
|---|---|
| Variable name | `DB` |
| D1 database | `renginiai-leads` |

Pridėkite ir **Production**, ir **Preview** aplinkoms.

> `Variable name` turi būti tiksliai `DB`. Kodas ieško `env.DB`.
> Neteisingas pavadinimas duos klaidą „Serverio konfigūracijos klaida“.

Po pakeitimo **būtina perkurti diegimą**: Deployments → paskutinis →
Retry deployment. Bindingai nepritaikomi seniems diegimams.

---

## 4 dalis — pranešimai į telefoną (5 min, neprivaloma)

Kad apie kiekvieną užklausą sužinotumėte per kelias sekundes, o ne
kitą dieną. Tai tiesiogiai keičia, kiek žmonių atsilieps, kai
perskambinsite.

1. Telegram programoje raskite **@BotFather** → `/newbot` → gausite token
2. Parašykite savo naujam botui bet kokią žinutę
3. Atidarykite naršyklėje (įrašę savo token):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   ir raskite `"chat":{"id":123456789}`
4. **Pages → Settings → Environment variables → Add:**

   | Kintamasis | Reikšmė | Tipas |
   |---|---|---|
   | `TELEGRAM_BOT_TOKEN` | jūsų token | **Encrypt** |
   | `TELEGRAM_CHAT_ID` | jūsų chat id | **Encrypt** |
   | `LEADS_TOKEN` | sugalvotas ilgas slaptažodis | **Encrypt** |

Perkurkite diegimą.

Be šių kintamųjų viskas veikia — tiesiog be pranešimų.

---

## 5 dalis — domenas (5 min)

**Pages projektas → Custom domains → Set up a domain**

- Jei domenas jau Cloudflare — įrašai sukuriami automatiškai
- Jei kitur — Cloudflare parodys, kokį `CNAME` pridėti pas registratorių

HTTPS sertifikatas išduodamas automatiškai per kelias minutes.

---

## 6 dalis — patikrinkite, kad veikia

1. Atidarykite puslapį telefone
2. Paspauskite **Skambinti** — turi atsidaryti skambinimo langas
3. Užpildykite formą savo tikru numeriu
4. Turi permesti į `/aciu.html`
5. Turi ateiti pranešimas į Telegram (jei nustatėte)
6. Patikrinkite bazę:

```bash
wrangler d1 execute renginiai-leads --remote \
  --command "SELECT id, name, phone, created_at FROM leads ORDER BY id DESC LIMIT 5;"
```

---

## Kontaktų sąrašo atsisiuntimas

Visi surinkti kontaktai — viena nuoroda naršyklėje:

```
https://jusudomenas.lt/api/leads?token=JUSU_LEADS_TOKEN&format=csv
```

Atsisiųs `kontaktai.csv`, kurį atidaro Excel su veikiančiomis
lietuviškomis raidėmis. Be `format=csv` gausite JSON.

> Ši nuoroda atveria visų klientų telefonus. Nesidalinkite ja ir
> nesiųskite per neapsaugotus kanalus.

---

## Kai kas nors neveikia

| Požymis | Priežastis | Sprendimas |
|---|---|---|
| Forma rodo „Nepavyko išsiųsti“, konsolėje 404 | Nenurodytas `Root directory` | 2 dalis, 3 punktas |
| Klaida „Serverio konfigūracijos klaida“ | Neprijungtas D1 bindingas arba pavadintas ne `DB` | 3 dalis |
| Forma veikia, bet bazė tuščia | Nepaleistas `schema.sql` | 1 dalis |
| Pranešimai neateina | Botui neparašyta pirma žinutė | 4 dalis, 2 punktas |
| `/api/leads` grąžina 503 | Nenustatytas `LEADS_TOKEN` | 4 dalis |
| Lietuviškos raidės CSV faile sugadintos | Excel atidarytas per „Import“ | Atidarykite failą dvigubu paspaudimu |
| Pakeitimai nesimato | Bindingai nepritaikyti senam diegimui | Retry deployment |

Platesnis sąrašas su tiksliomis klaidų žinutėmis:
[`docs/CLOUDFLARE-KLAIDOS.md`](../docs/CLOUDFLARE-KLAIDOS.md)
