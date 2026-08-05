/* Slapukų sutikimas — Microsoft Clarity ir Google Tag Manager yra
   neesminė analitika/rinkodara, todėl pagal BDAR/ePrivacy negali būti
   paleisti be išankstinio lankytojo sutikimo. Šis failas:

   1. Rodo juostą pirmo apsilankymo metu, PRIEŠ įkraunant įrankius —
      nei Clarity, nei GTM <script> žymų puslapiuose nėra, jas prideda
      tik loadAnalytics() žemiau.
   2. Įkrauna juos TIK paspaudus „Sutinku". Atmetimo atveju apskritai
      neįkrauna, kol vartotojas savarankiškai nepakeičia pasirinkimo per
      poraštės nuorodą.
   3. Sprendimą įsimena localStorage, kad juosta nesikartotų kas
      apsilankymą.

   GTM sąmoningai gaudomas visas, o ne per jo paties Consent Mode:
   Consent Mode konteinerį vis tiek užkrautų ir leistų siųsti
   „cookieless pings", o pilnas blokavimas iki sutikimo yra
   nedviprasmiškas. Kai prireiks tag'ų, kurie turi veikti be sutikimo,
   tada verta pereiti prie Consent Mode.

   Sąmoningai be „X" uždarymo mygtuko: uždarymas be aiškaus pasirinkimo
   priežiūros institucijų dažnai traktuojamas kaip numanomas sutikimas,
   o tai neteisėta pagal BDAR — sutikimas turi būti aktyvus veiksmas.
   Abu mygtukai vienodo matomumo, nes „Sutinku" negali būti akivaizdžiai
   patrauklesnis už atsisakymą (tai irgi laikoma pažeidimu). */
(function () {
  'use strict';

  var KEY = 'cookieConsent';

  /* GTM turi startuoti pirmas: jei jame sukonfigūruotas tag'as, kuris
     pats siunčia įvykius, jam reikia, kad dataLayer jau egzistuotų. */
  var SCRIPTS = ['/assets/js/gtm.js', '/assets/js/clarity.js'];

  var loadAnalytics = function () {
    if (window.__analyticsRequested) return;
    window.__analyticsRequested = true;
    SCRIPTS.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      document.head.appendChild(s);
    });
  };

  var hideBar = function (bar) {
    bar.classList.remove('on');
    setTimeout(function () { bar.remove(); }, 300);
  };

  var buildBar = function () {
    if (document.querySelector('.cookie-bar')) return;

    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Slapukų nustatymai');
    bar.innerHTML =
      '<p>Naudojame slapukus, kad suprastume, kaip lankytojai naudojasi ' +
      'svetaine. Formos laukelių turinio nematome. ' +
      '<a href="/privatumas">Privatumo politika</a>.</p>' +
      '<div class="cookie-bar-actions">' +
      '<button type="button" class="btn-outline" data-choice="denied">Tik būtini</button>' +
      '<button type="button" class="btn" data-choice="granted">Sutinku</button>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('on'); });

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-choice]');
      if (!btn) return;
      var choice = btn.getAttribute('data-choice');
      localStorage.setItem(KEY, choice);
      hideBar(bar);
      if (choice === 'granted') loadAnalytics();
    });
  };

  var init = function () {
    var choice = localStorage.getItem(KEY);
    if (choice === 'granted') { loadAnalytics(); return; }
    if (choice === 'denied') return;
    buildBar();
  };

  /* Poraštės nuorodai „Slapukų nustatymai" — leidžia bet kada atšaukti
     arba duoti sutikimą iš naujo. BDAR reikalauja, kad atšaukti būtų
     taip pat lengva, kaip iš pradžių sutikti, tad ši nuoroda turi
     egzistuoti kiekviename puslapyje, ne tik pirmo apsilankymo metu.

     Klausomasi document lygyje (event delegation), o ne pačio elemento,
     nes šis scriptas kraunamas <head> dar prieš poraštę atsirandant
     DOM'e — tiesioginis querySelector čia visada grąžintų null. CSP
     script-src neleidžia inline onclick="" atributų (žr. CF-006), tad
     šitai vienintelis būdas pririšti elgesį be jo. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.js-cookie-settings');
    if (!link) return;
    e.preventDefault();
    buildBar();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
