/* Google Tag Manager — konteineris GTM-M2LFWTG7.

   Perkelta iš Google duodamo inline <script> į atskirą failą dėl tos
   pačios priežasties kaip Clarity: svetainės CSP script-src yra 'self'
   be 'unsafe-inline' (žr. _headers). Google oficialiai siūlo nonce, bet
   nonce reikalauja, kad serveris kiekvienam atsakymui generuotų naują
   reikšmę ir įrašytų ją į HTML — Workers Static Assets teikia statinius
   failus, tad tam reikėtų Worker'io, perrašinėjančio HTML kiekvienai
   užklausai. Išorinis 'self' kilmės failas tą patį pasiekia be jokios
   papildomos infrastruktūros.

   Kodas identiškas Google duotam, tik be <script> žymos.

   SVARBU dėl tag'ų GTM viduje: standartiniai tag'ai (GA4 ir kt.), kurie
   kraunasi kaip išorinis scriptas iš googletagmanager.com, veiks. O
   „Custom JavaScript" kintamieji GTM'e naudoja eval() ir be
   'unsafe-eval' tyliai grąžins undefined; „Custom HTML" tag'ai su inline
   JS taip pat bus blokuojami. Tai sąmoningas kompromisas — 'unsafe-eval'
   ar 'unsafe-inline' pridėjimas panaikintų didžiąją dalį CSP naudos
   puslapyje, kuris renka asmens duomenis per formą. Reikiamus tag'us
   verta daryti per GTM „Custom Templates" arba pridėti konkrečius
   domenus į _headers. */
(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-M2LFWTG7');
