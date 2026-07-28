/**
 * Worker įėjimo taškas.
 *
 * Anksčiau tai buvo Cloudflare Pages projektas, kur `functions/` katalogas
 * pats virsdavo maršrutais. Workers Static Assets veikia kitaip: yra vienas
 * scenarijus, kuris pirmas pamato kiekvieną užklausą, pasiima tai, kas jo,
 * ir visa kita perduoda statiniams failams per env.ASSETS.
 *
 * Praktinis skirtumas statant naują funnel'į: maršrutai dabar aprašyti čia,
 * matomai vienoje vietoje, o ne paslėpti failų pavadinimuose.
 */

import { handleLead } from './api/lead.js';
import { handleLeadsExport } from './api/leads.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/lead') {
      if (request.method !== 'POST') return json({ error: 'Naudokite POST' }, 405);
      return handleLead(request, env);
    }

    if (path === '/api/leads') {
      if (request.method !== 'GET') return json({ error: 'Naudokite GET' }, 405);
      return handleLeadsExport(request, env);
    }

    /* Nežinomas /api/ kelias grąžina JSON, o ne HTML puslapį — kitaip
       fetch() naršyklėje gautų HTML ir suklustų prie response.json(). */
    if (path.startsWith('/api/')) return json({ error: 'Nerasta' }, 404);

    return env.ASSETS.fetch(request);
  },
};
