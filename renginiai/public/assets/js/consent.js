/* Slapukų sutikimas — Microsoft Clarity yra neesminė analitika, todėl
   pagal BDAR/ePrivacy negali būti paleista be išankstinio lankytojo
   sutikimo. Šis failas:

   1. Rodo juostą pirmo apsilankymo metu, PRIEŠ įkraunant Clarity —
      pats Clarity <script> tag'as niekur kitur puslapiuose neįtrauktas,
      jį prideda tik loadClarity() žemiau.
   2. Įkrauna Clarity TIK paspaudus „Sutinku". Atmetimo atveju
      apskritai neįkrauna, kol vartotojas savarankiškai nepakeičia
      pasirinkimo per poraštės nuorodą.
   3. Sprendimą įsimena localStorage, kad juosta nesikartotų kas
      apsilankymą.

   Sąmoningai be „X" uždarymo mygtuko: uždarymas be aiškaus pasirinkimo
   priežiūros institucijų dažnai traktuojamas kaip numanomas sutikimas,
   o tai neteisėta pagal BDAR — sutikimas turi būti aktyvus veiksmas.
   Abu mygtukai vienodo matomumo, nes „Sutinku" negali būti akivaizdžiai
   patrauklesnis už atsisakymą (tai irgi laikoma pažeidimu). */
(function () {
  'use strict';

  var KEY = 'cookieConsent';

  var loadClarity = function () {
    if (window.__clarityRequested) return;
    window.__clarityRequested = true;
    var s = document.createElement('script');
    s.src = '/assets/js/clarity.js';
    document.head.appendChild(s);
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
      '<p>Naudojame <em>Microsoft Clarity</em>, kad suprastume, kaip ' +
      'lankytojai naudojasi svetaine — jokių asmens duomenų, formos ' +
      'laukelių turinį šis įrankis automatiškai mato užmaskuotą. ' +
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
      if (choice === 'granted') loadClarity();
    });
  };

  var init = function () {
    var choice = localStorage.getItem(KEY);
    if (choice === 'granted') { loadClarity(); return; }
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
