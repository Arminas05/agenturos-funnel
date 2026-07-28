/* ═══════════════════════════════════════════════════════════════════════
   Funnel runtime — agency baseline
   No dependencies. Safe to copy into a new funnel unchanged; only the
   selectors at the bottom (form field ids) are page-specific.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Metai poraštėje ──────────────────────────────────────────── */
  document.querySelectorAll('.year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ── Nuotraukų atsarginis variantas ───────────────────────────────
     Kol į assets/img/ neįkeltos tikros nuotraukos, rodomas punktyrinis
     rėmelis su užrašu vietoj sugadintos paveikslėlio ikonos.
     Tvarkoma čia, o ne inline onerror atribute, kad CSP galėtų likti
     be 'unsafe-inline' script-src dalyje. */
  var photos = document.querySelectorAll('.photo img');
  var photosFailed = 0;

  photos.forEach(function (img) {
    var fail = function () {
      var fig = img.parentElement;
      if (!fig || fig.classList.contains('photo-empty')) return;
      fig.classList.add('photo-empty');
      var cap = fig.querySelector('figcaption');
      if (cap) cap.remove();
      var note = document.createElement('span');
      note.textContent = 'Vieta nuotraukai: ' + img.getAttribute('src').split('/').pop();
      fig.appendChild(note);
      img.remove();

      /* Jei nepavyko NĖ VIENA nuotrauka, visa įrodymų sekcija slepiama.
         Keturi punktyriniai rėmeliai atrodo kaip sugedęs puslapis, o
         įrodymų sekcija be įrodymų vis tiek nieko neparduoda. Įkėlus
         bent vieną nuotrauką sekcija grįžta savaime. */
      photosFailed++;
      if (photosFailed === photos.length) {
        var section = document.getElementById('irodymai');
        if (section) section.hidden = true;
        console.info(
          'Nuotraukų nėra — įrodymų sekcija paslėpta. ' +
          'Įkelkite failus į assets/img/ (žr. assets/img/README.md).'
        );
      }
    };
    img.addEventListener('error', fail);
    /* Jei paveikslėlis nepavyko dar prieš prisegant klausytoją. */
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ── FAQ akordeonas ───────────────────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var wasOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Lipnus mobilus CTA ───────────────────────────────────────────
     Rodomas tik nuslinkus žemiau pirmojo ekrano, kad nedengtų hero
     mygtuko. Slepiamas prie formos, kad nedengtų „Siųsti" mygtuko. */
  var sticky = document.getElementById('sticky');
  var form = document.getElementById('leadForm');

  if (sticky) {
    var updateSticky = function () {
      var past = window.scrollY > window.innerHeight * 0.8;
      var atForm = false;

      if (form) {
        var r = form.getBoundingClientRect();
        atForm = r.top < window.innerHeight && r.bottom > 0;
      }
      sticky.classList.toggle('on', past && !atForm);
    };
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    updateSticky();
  }

  /* ── Exit intent ──────────────────────────────────────────────────
     Tik kompiuteryje (pelė išeina pro viršų) ir tik kartą per sesiją. */
  var exit = document.getElementById('exit');
  if (exit && !sessionStorage.getItem('exitShown')) {
    var showExit = function (e) {
      if (e.clientY > 0) return;
      if (window.innerWidth < 900) return;
      exit.classList.add('on');
      sessionStorage.setItem('exitShown', '1');
      document.removeEventListener('mouseout', showExit);
    };
    setTimeout(function () {
      document.addEventListener('mouseout', showExit);
    }, 8000);

    var closeExit = function () { exit.classList.remove('on'); };
    document.getElementById('exitClose').addEventListener('click', closeExit);
    document.getElementById('exitCta').addEventListener('click', closeExit);
    exit.addEventListener('click', function (e) { if (e.target === exit) closeExit(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeExit();
    });
  }

  /* ── Formos validacija ir siuntimas ───────────────────────────── */
  if (!form) return;

  var msg = document.getElementById('formMsg');
  var submitBtn = document.getElementById('submitBtn');
  var submitting = false;

  var setErr = function (inputId, on) {
    var input = document.getElementById(inputId);
    var err = document.getElementById('err-' + inputId);
    if (input && input.type !== 'checkbox') input.classList.toggle('invalid', on);
    if (err) err.classList.toggle('on', on);
  };

  /* Telefonas: nuimame viską, kas ne skaitmuo (leidžiame + priekyje).
     Lietuviški formatai: +37060000000, 860000000, 8 600 00000.
     Sąmoningai laisva taisyklė — geriau priimti keistą numerį ir
     perskambinti, negu atmesti tikrą klientą dėl tarpo. */
  var phoneOk = function (v) {
    var digits = v.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  };

  var emailOk = function (v) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
  };

  var showMsg = function (text, kind) {
    msg.textContent = text;
    msg.className = 'form-msg on ' + kind;
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;

    var name = document.getElementById('fName').value.trim();
    var phone = document.getElementById('fPhone').value.trim();
    var email = document.getElementById('fEmail').value.trim();
    var consent = document.getElementById('fConsent').checked;

    var bad = false;

    setErr('fName', false);
    setErr('fPhone', false);
    setErr('fEmail', false);
    setErr('fConsent', false);

    if (!name) { setErr('fName', true); bad = true; }
    if (!phoneOk(phone)) { setErr('fPhone', true); bad = true; }
    if (email && !emailOk(email)) { setErr('fEmail', true); bad = true; }
    if (!consent) { setErr('fConsent', true); bad = true; }

    if (bad) {
      showMsg('Patikrinkite pažymėtus laukelius.', 'bad');
      return;
    }

    submitting = true;
    msg.className = 'form-msg';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Siunčiama…';

    var payload = {
      name: name,
      phone: phone,
      email: email,
      event_type: document.getElementById('fType').value,
      event_date: document.getElementById('fDate').value,
      company: document.getElementById('fCompany').value, /* honeypot */
      page: window.location.pathname,
      referrer: document.referrer || ''
    };

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data && r.data.error ? r.data.error : 'Klaida');
        window.location.href = '/aciu.html';
      })
      .catch(function () {
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Perskambinkite man';
        showMsg(
          'Nepavyko išsiųsti. Paskambinkite tiesiai: +370 600 00000',
          'bad'
        );
      });
  });
})();
