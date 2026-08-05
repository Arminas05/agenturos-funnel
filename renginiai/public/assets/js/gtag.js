/* Google tag (gtag.js) — GA4, matavimo ID G-W0ZVSJP6EN, įdiegtas
   tiesiogiai (be GTM). Perkelta iš Google duodamo inline <script> į
   atskirą failą — ta pati priežastis kaip GTM/Clarity: CSP script-src
   yra 'self' be 'unsafe-inline'.

   Naudoja tą patį window.dataLayer, kaip ir GTM (assets/js/gtm.js) —
   tai numatytas, palaikomas Google elgesys, abu gali veikti kartu be
   konflikto. Jei GTM konteinerio viduje taip pat sukonfigūruotas GA4
   žymeklis su tuo pačiu matavimo ID, peržiūrų skaičius gali dubliuotis
   — verta patikrinti GTM konteinerį prieš pasitikint statistika. */
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-W0ZVSJP6EN';
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', 'G-W0ZVSJP6EN');
})();
