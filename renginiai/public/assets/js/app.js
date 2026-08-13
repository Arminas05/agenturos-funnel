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

  /* ── Tingus medžiagos krovimas ────────────────────────────────────
     Trys vaizdo įrašai sveria apie 5 MB. Kraunant juos iškart puslapis
     telefone mirtų dar prieš pamatant antraštę, todėl `src` priskiriamas
     tik tada, kai kadras artėja prie ekrano.

     Vaizdo įrašai groja be garso ir tik būdami matomi — už ekrano ribų
     stabdomi, kad nešvaistytų baterijos ir duomenų. */
  var media = document.querySelectorAll('figure img[data-src], figure video[data-src]');
  var mediaFailed = 0;

  var markFailed = function (el) {
    var fig = el.parentElement;
    if (!fig || fig.classList.contains('media-empty')) return;

    /* Portretas/klipas sekcijoje „Kas aš toks" nėra įrodymų tinklelio
       dalis: jo nesant tekstas turi likti vienas, o ne šalia punktyrinio
       langelio su failo pavadinimu. Ši patikra būtinai pirmesnė už kodo
       tikrinimą žemiau — kitaip vaizdo įrašas, kurio naršyklė
       neiškoduoja (kodas 4), patektų į tą šaką ir figūra dingtų be
       .about-solo žymos, o tekstas liktų įstrigęs 300 px stulpelyje. */
    if (fig.classList.contains('about-photo')) {
      var about = fig.parentElement;
      fig.remove();
      /* Vien pašalinti kadro neužtenka: tinklelio stulpeliai aprašyti
         CSS'e, todėl likęs tekstas atsistotų į 300 px portreto stulpelį
         ir liktų su tuščia puse dešinėje. Žyma grąžina jį į vieną
         pilno pločio stulpelį. */
      if (about) about.classList.add('about-solo');
      return;
    }

    /* Skiriame dvi visiškai skirtingas nesėkmes.
       MEDIA_ERR_SRC_NOT_SUPPORTED (kodas 4) reiškia, kad failas yra, bet
       naršyklė jo neiškoduoja — pavyzdžiui, build'as be H.264. Tada
       kadras tiesiog pašalinamas: svečiui nereikia matyti pavadinimo
       „video-01.mp4" punktyriniame langelyje.
       Visos kitos klaidos (dažniausiai 404) reiškia trūkstamą failą, ir
       ten pavadinimas yra naudingas — būtent jo reikia diegiant. */
    if (el.tagName === 'VIDEO' && el.error && el.error.code === 4) {
      fig.remove();
      mediaFailed++;
      return;
    }
    fig.classList.remove('loading');
    fig.classList.add('media-empty');
    var cap = fig.querySelector('figcaption');
    if (cap) cap.remove();
    var note = document.createElement('span');
    note.textContent = (el.getAttribute('data-src') || '').split('/').pop();
    fig.appendChild(note);
    el.remove();

    /* Nepavykus visai medžiagai įrodymų sekcija slepiama: tinklelis
       tuščių rėmelių atrodo kaip sugedęs puslapis, o įrodymų sekcija
       be įrodymų vis tiek nieko neparduoda. */
    mediaFailed++;
    if (mediaFailed === media.length) {
      var section = document.getElementById('irodymai');
      if (section) section.hidden = true;
    }
  };

  var loadMedia = function (el) {
    if (el.dataset.loaded) return;
    el.dataset.loaded = '1';
    el.addEventListener('error', function () { markFailed(el); });

    if (el.tagName === 'VIDEO') {
      el.addEventListener('loadeddata', function () {
        el.parentElement.classList.remove('loading');
      });
      el.src = el.dataset.src;
      el.load();
    } else {
      el.addEventListener('load', function () {
        el.parentElement.classList.remove('loading');
      });
      el.src = el.dataset.src;
    }
  };

  if (media.length && 'IntersectionObserver' in window) {
    /* Krauname anksčiau, negu kadras pasirodo ekrane, kad iki jo
       atslinkus vaizdas jau būtų vietoje. */
    var loader = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { loadMedia(e.target); loader.unobserve(e.target); }
      });
    }, { rootMargin: '300px 0px' });

    /* Grojame tik tai, kas matoma. */
    var player = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          var play = v.play();
          if (play && play.catch) play.catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });

    media.forEach(function (el) {
      loader.observe(el);
      if (el.tagName === 'VIDEO') player.observe(el);
    });
  } else {
    /* Be IntersectionObserver (labai senos naršyklės) kraunama iškart. */
    media.forEach(loadMedia);
  }

  /* ── FAQ akordeonas ───────────────────────────────────────────────
     Aukštis imamas iš turinio, o ne fiksuotas CSS'e: fiksuota reikšmė
     tyliai nukerpa ilgesnį atsakymą, ir tai pastebima tik tada, kai
     kas nors jį perskaito iki galo. */
  var setOpenHeight = function (item) {
    var a = item.querySelector('.faq-a');
    var inner = item.querySelector('.faq-a-inner');
    if (a && inner) a.style.maxHeight = inner.scrollHeight + 'px';
  };

  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var wasOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var a = i.querySelector('.faq-a');
        if (a) a.style.maxHeight = '';
        var q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        setOpenHeight(item);
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Pakeitus lango plotį tekstas persidėlioja ir atsakymas tampa
     aukštesnis arba žemesnis — perskaičiuojame atidarytąjį. */
  window.addEventListener('resize', function () {
    var open = document.querySelector('.faq-item.open');
    if (open) setOpenHeight(open);
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
      city: document.getElementById('fCity').value.trim(),
      guest_count: document.getElementById('fGuests').value.trim(),
      message: document.getElementById('fMessage').value.trim(),
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
        window.location.href = '/aciu';
      })
      .catch(function () {
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Prašau perskambinti';
        showMsg(
          'Nepavyko išsiųsti. Paskambinkite tiesiai: +370 674 72202',
          'bad'
        );
      });
  });
})();
