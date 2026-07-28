/**
 * POST /api/lead — priima formos duomenis, įrašo į D1, praneša telefonu.
 *
 * Cloudflare Pages Functions maršrutas nustatomas pagal failo kelią:
 *   functions/api/lead.js  →  /api/lead
 * Failo pervadinti negalima — maršrutas dings.
 *
 * Privalomas binding:
 *   DB                  → D1 duomenų bazė (wrangler.toml + Pages nustatymai)
 *
 * Neprivalomi (be jų viskas veikia, tik be papildomų funkcijų):
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

export async function onRequestPost({ request, env }) {
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

  await notify(env, lead);

  return json({ ok: true });
}

/* GET į šį adresą neturi prasmės — grąžiname aiškų atsakymą vietoj 405. */
export const onRequestGet = () =>
  json({ error: 'Naudokite POST' }, 405);
