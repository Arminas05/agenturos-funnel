/* Microsoft Clarity — elgsenos analitika (šilumos žemėlapiai, sesijų
   įrašai). Perkelta iš Microsoft duodamo inline <script> į atskirą failą
   sąmoningai: svetainės CSP script-src yra 'self' be 'unsafe-inline'
   (žr. _headers), o inline scriptą leisti reikštų arba susilpninti CSP
   visiems scriptams, arba laikyti sinchronizuotą sha256 hash'ą, kuris
   tyliai sulūžtų nuo menkiausio suformatavimo pakeitimo. Šitaip pakanka
   leisti *.clarity.ms tik script-src/connect-src/img-src kryptims.

   Kodas identiškas Microsoft duotam — jei jie kada atnaujins tag'ą,
   tiesiog perrašyti šio failo turinį. */
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'xxmkmsldpc');
