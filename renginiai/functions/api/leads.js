/**
 * GET /api/leads — kontaktų sąrašo eksportas.
 *
 * Apsauga: privalomas LEADS_TOKEN aplinkos kintamasis.
 * Be jo endpoint'as IŠVIS neveikia (grąžina 503), o ne veikia atvirai —
 * saugiau sugesti nei tyliai paviešinti klientų telefonus.
 *
 * Naudojimas:
 *   https://jusu-domenas.lt/api/leads?token=SLAPTAS           → JSON
 *   https://jusu-domenas.lt/api/leads?token=SLAPTAS&format=csv → CSV į Excel
 */

/* CSV laukas: kabutės dvigubinamos, viskas apgaubiama.
   Papildomai neutralizuojamos Excel formulės iš kliento įvesto teksto
   (CSV injection). = ir @ pavojingi visada.
   + ir - praleidžiami TIK tada, kai reikšmė atrodo kaip telefono numeris
   (skaitmenys, tarpai, brūkšneliai, skliaustai) — kitaip kiekvienas
   +370... numeris faile gautų apostrofą ir sąrašas taptų nepatogus. */
const PHONE_SHAPE = /^[+\-]?[\d\s()\-.]{6,}$/;

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  const risky = /^[=@]/.test(s) || (/^[+\-]/.test(s) && !PHONE_SHAPE.test(s));
  return '"' + (risky ? "'" + s : s).replace(/"/g, '""') + '"';
};

export async function onRequestGet({ request, env }) {
  if (!env.LEADS_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'LEADS_TOKEN nenustatytas. Endpoint išjungtas.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const token =
    url.searchParams.get('token') ||
    (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

  if (token !== env.LEADS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Neteisingas token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'D1 binding "DB" nerastas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, name, phone, email, event_type, event_date,
            page, referrer, country, created_at
       FROM leads
      ORDER BY id DESC
      LIMIT 5000`
  ).all();

  if (url.searchParams.get('format') === 'csv') {
    const cols = [
      'id', 'name', 'phone', 'email', 'event_type',
      'event_date', 'page', 'referrer', 'country', 'created_at',
    ];
    const rows = [cols.join(',')];
    for (const r of results) rows.push(cols.map((c) => csvCell(r[c])).join(','));

    /* BOM — be jo Excel sugadina lietuviškas raides CSV faile. */
    return new Response('﻿' + rows.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="kontaktai.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(JSON.stringify({ count: results.length, leads: results }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
