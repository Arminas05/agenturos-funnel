#!/usr/bin/env node
/**
 * Patikrina temos spalvų kontrastą pagal WCAG AA (4.5:1 normaliam tekstui).
 *
 * Naudojimas:
 *   node funnels/_shared/contrast-check.mjs funnels/renginiai/public/assets/css/theme-renginiai.css
 *
 * Kodėl atskiras skriptas: auksas, alyvuogių žalia ir kitos šviesios
 * spalvos akiai atrodo tinkamos, o skaičiais krenta žemiau ribos. Paletę
 * verta patikrinti prieš rašant puslapį, o ne po to, kai spalva jau
 * išbarstyta po dvidešimt vietų.
 */

import { readFileSync } from 'node:fs';

const lum = (hex) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const file = process.argv[2];
if (!file) {
  console.error('Nurodykite temos CSS failą.');
  process.exit(1);
}

const css = readFileSync(file, 'utf8');
const token = (name) => {
  const m = css.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9A-Fa-f]{6})'));
  return m ? m[1].toUpperCase() : null;
};

const t = {};
for (const n of ['paper', 'paper-warm', 'ink', 'ink-soft', 'ink-mute',
                 'accent', 'accent-dark', 'accent-tint', 'danger']) {
  t[n] = token(n);
  if (!t[n]) console.warn(`⚠ trūksta --${n}`);
}

const WHITE = '#FFFFFF';

/* Poros tikrinamos taip, kaip jos realiai naudojamos puslapyje.
   Muted tekstas sėdi ant ABIEJŲ paviršių, todėl tikrinami abu. */
const pairs = [
  ['ink ant paper',              t.ink,         t.paper,       4.5],
  ['ink-soft ant paper',         t['ink-soft'], t.paper,       4.5],
  ['ink-mute ant paper',         t['ink-mute'], t.paper,       4.5],
  ['ink-mute ant paper-warm',    t['ink-mute'], t['paper-warm'], 4.5],
  ['accent-dark tekstas ant paper', t['accent-dark'], t.paper,  4.5],
  ['balta ant accent (CTA)',     WHITE,         t.accent,      4.5],
  ['balta ant accent-dark',      WHITE,         t['accent-dark'], 4.5],
  ['accent-dark ant accent-tint', t['accent-dark'], t['accent-tint'], 4.5],
  ['danger ant paper',           t.danger,      t.paper,       4.5],
];

let failed = 0;
for (const [label, a, b, min] of pairs) {
  if (!a || !b) continue;
  const r = ratio(a, b);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  ${label}`);
}

console.log(
  failed
    ? `\n${failed} pora (-os) nepraeina. Tamsinkite spalvą, kol praeis.`
    : '\nVisos poros praeina WCAG AA (normalus tekstas).'
);
process.exit(failed ? 1 : 0);
