/**
 * POST /api/lead — priima formos duomenis, įrašo į D1, praneša telefonu.
 *
 * Maršrutą priskiria src/index.js. Šis failas eksportuoja gryną
 * funkciją, todėl jį galima testuoti atskirai nuo maršrutizavimo.
 *
 * Privalomas binding:
 *   DB                  → D1 duomenų bazė (wrangler.toml + Pages nustatymai)
 *
 * Neprivalomi (be jų viskas veikia, tik be papildomų funkcijų):
 *   RESEND_API_KEY      → momentinis pranešimas el. paštu
 *   LEAD_EMAIL_TO       → kam siųsti (pvz. labas@vedejasandrius.lt)
 *   LEAD_EMAIL_FROM     → nuo ko (turi būti Resend patvirtintas domenas)
 *   TELEGRAM_BOT_TOKEN  → momentinis pranešimas į telefoną
 *   TELEGRAM_CHAT_ID
 *   TURNSTILE_SECRET    → Cloudflare Turnstile apsauga nuo botų
 *   LEADS_TOKEN         → slaptažodis /api/leads eksportui
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

/* Apkarpome, kad į bazę nepatektų megabaitiniai laukai. */
const clean = (v, max = 200) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const phoneOk = (v) => {
  const d = v.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15;
};

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body }
  );
  const data = await res.json();
  return data.success === true;
}

/* Kliento įvestas tekstas keliauja į el. laišką, todėl HTML dalyje jį
   privaloma ekranuoti. Be to vardas „<b>Jonas" arba sąmoningai
   suklastotas laukas galėtų iškraipyti laiško turinį pašto kliente. */
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* Pranešimas el. paštu per Resend.
   Kodėl ne Cloudflare Email Service ir ne MailChannels: MailChannels
   nemokamą Workers paslaugą nutraukė 2024 m., o Cloudflare Email Sending
   onboarding'as domenui prideda savo MX įrašus — tai perrašytų Hostinger
   MX ir sugriautų jau veikiančias @vedejasandrius.lt dėžutes. Resend
   patvirtinimui pakanka įrašų ant atskiro `send.` subdomeno, todėl
   šakninis MX lieka nepaliestas.

   Klaida čia NIEKADA negali sugriauti užklausos — lead'as jau bazėje,
   o klientui svarbu matyti „ačiū", ne mūsų problemas. */
async function notifyEmail(env, lead) {
  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL_TO || !env.LEAD_EMAIL_FROM) return;

  const rows = [
    ['Vardas', lead.name],
    ['Telefonas', lead.phone],
    ['El. paštas', lead.email],
    ['Šventė', lead.event_type],
    ['Data', lead.event_date],
    ['Puslapis', lead.page],
    ['Iš kur atėjo', lead.referrer],
  ].filter(function (r) { return r[1]; });

  const text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
  const html =
    '<h2 style="font:600 18px system-ui,sans-serif;margin:0 0 12px">Nauja užklausa iš svetainės</h2>' +
    '<table style="font:15px/1.5 system-ui,sans-serif;border-collapse:collapse">' +
    rows.map(function (r) {
      return '<tr><td style="padding:4px 14px 4px 0;color:#666">' + esc(r[0]) +
             '</td><td style="padding:4px 0"><b>' + esc(r[1]) + '</b></td></tr>';
    }).join('') +
    '</table>' +
    '<p style="font:13px system-ui,sans-serif;color:#888;margin-top:16px">' +
    'Skambinti: <a href="tel:' + esc(lead.phone) + '">' + esc(lead.phone) + '</a></p>';

  const payload = {
    from: env.LEAD_EMAIL_FROM,
    to: [env.LEAD_EMAIL_TO],
    subject: 'Nauja užklausa: ' + lead.name + (lead.event_type ? ' — ' + lead.event_type : ''),
    text: text,
    html: html,
  };

  /* Atsakant į laišką atsakymas keliauja tiesiai klientui, o ne į savo
     pašto dėžutę. Tik jei klientas el. paštą nurodė — jis nebūtinas. */
  if (lead.email) payload.reply_to = lead.email;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      /* Žurnale paliekame priežastį — be jos „laiškas neatėjo" tampa
         neįmanoma diagnozuoti, o pati užklausa vis tiek pavyko. */
      console.error('Resend klaida:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Resend nepasiekiamas:', err && err.message);
  }
}

/* Pranešimas į Telegram. Klaida čia NIEKADA negali sugriauti užklausos —
   lead'as jau bazėje, o klientui svarbu matyti „ačiū", ne mūsų problemas. */
async function notify(env, lead) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const lines = [
    '🔔 Naujas skambučio prašymas',
    '',
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    lead.email ? `✉️ ${lead.email}` : null,
    lead.event_type ? `🎉 ${lead.event_type}` : null,
    lead.event_date ? `📅 ${lead.event_date}` : null,
  ].filter(Boolean);

  try {
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: lines.join('\n'),
        }),
      }
    );
  } catch (_) {
    /* tylime sąmoningai */
  }
}

export async function handleLead(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Netinkama užklausa' }, 400);
  }

  /* 1. Honeypot. Botui atsakome 200, kad nesimokytų iš klaidos. */
  if (clean(body.company)) {
    return json({ ok: true });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160);

  if (!name) return json({ error: 'Trūksta vardo' }, 400);
  if (!phoneOk(phone)) return json({ error: 'Netinkamas telefono numeris' }, 400);
  if (email && !emailOk(email)) return json({ error: 'Netinkamas el. paštas' }, 400);

  /* 2. Turnstile — tik jei raktas nustatytas. */
  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(
      clean(body.turnstile_token, 2048),
      env.TURNSTILE_SECRET,
      request.headers.get('CF-Connecting-IP')
    );
    if (!ok) return json({ error: 'Nepavyko patikrinti. Bandykite dar kartą.' }, 403);
  }

  const lead = {
    name,
    phone,
    email,
    event_type: clean(body.event_type, 40),
    event_date: clean(body.event_date, 20),
    page: clean(body.page, 200),
    referrer: clean(body.referrer, 300),
    country: request.headers.get('CF-IPCountry') || '',
    user_agent: clean(request.headers.get('User-Agent') || '', 300),
    created_at: new Date().toISOString(),
  };

  if (!env.DB) {
    /* Aiški klaida, o ne tyli 500 — dažniausia diegimo klaida yra
       neprijungtas D1 binding'as Pages nustatymuose. */
    console.error('D1 binding "DB" nerastas. Patikrinkite Pages → Settings → Bindings.');
    return json({ error: 'Serverio konfigūracijos klaida' }, 500);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leads
         (name, phone, email, event_type, event_date,
          page, referrer, country, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        lead.name,
        lead.phone,
        lead.email,
        lead.event_type,
        lead.event_date,
        lead.page,
        lead.referrer,
        lead.country,
        lead.user_agent,
        lead.created_at
      )
      .run();
  } catch (err) {
    console.error('D1 INSERT klaida:', err && err.message);
    return json({ error: 'Nepavyko išsaugoti' }, 500);
  }

  /* Pranešimai paleidžiami fone. Anksčiau `await notify(...)` laikė
     lankytoją laukiantį tol, kol atsakys Telegram; pridėjus dar ir
     Resend, laukimas būtų dviguba trečiosios šalies kelionė vien tam,
     kad pasirodytų „ačiū" puslapis. `waitUntil` leidžia atsakyti iš
     karto, o Worker'is pranešimus pabaigia jau po atsakymo.

     allSettled, o ne all: vieno kanalo gedimas neturi nutraukti kito. */
  const pending = Promise.allSettled([notifyEmail(env, lead), notify(env, lead)]);
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(pending);
  } else {
    /* Testuose ir senesniuose iškvietimuose be ctx elgiamės kaip anksčiau. */
    await pending;
  }

  return json({ ok: true });
}
