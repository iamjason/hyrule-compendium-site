#!/usr/bin/env node
/** Verify the palette in src/styles/global.css meets WCAG AA. Run: npm run contrast */
const hex = (h) => { const n = h.replace('#',''); return [0,2,4].map(i => parseInt(n.slice(i,i+2),16)); };
const lin = (c) => { const s = c/255; return s <= 0.03928 ? s/12.92 : ((s+0.055)/1.055)**2.4; };
const lum = (h) => { const [r,g,b] = hex(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; };
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };

const dark = {
  bg:'#0E1319', bgElev:'#161D26', surface:'#182029',
  text:'#E8EEF4', muted:'#9DAAB8', faint:'#6F7E8C',
  accent:'#58CFE6', accentInk:'#08131A', warm:'#F2A93E',
  ok:'#5FD98A', violet:'#B49CFB', border:'#2A3541', borderStrong:'#3E4C5B',
};
const light = {
  bg:'#F1F4F7', bgElev:'#FFFFFF', surface:'#FFFFFF',
  text:'#131C26', muted:'#51606D', faint:'#6B7885',
  accent:'#0A6577', accentInk:'#FFFFFF', warm:'#8A5410',
  ok:'#146B3A', violet:'#5B3FBF', border:'#D7DFE7', borderStrong:'#AFBCC9',
};

// [label, fg, bg, minimum]  — 4.5 body text, 3.0 large text & non-text UI
const pairs = (p) => [
  ['body text on bg',        p.text,   p.bg,      4.5],
  ['body text on surface',   p.text,   p.surface, 4.5],
  ['muted on bg',            p.muted,  p.bg,      4.5],
  ['muted on surface',       p.muted,  p.surface, 4.5],
  ['faint on bg (large/mono)',p.faint, p.bg,      3.0],
  ['faint on surface',       p.faint,  p.surface, 3.0],
  ['accent link on bg',      p.accent, p.bg,      4.5],
  ['accent link on surface', p.accent, p.surface, 4.5],
  ['ink on accent button',   p.accentInk, p.accent, 4.5],
  ['warm on bg',             p.warm,   p.bg,      4.5],
  ['warm on surface',        p.warm,   p.surface, 4.5],
  ['stable badge text',      p.ok,     p.surface, 4.5],
  ['experimental badge text',p.violet, p.surface, 4.5],
  ['border vs bg (UI)',      p.borderStrong, p.bg, 1.0],
];

let fails = 0;
for (const [theme, p] of [['DARK', dark], ['LIGHT', light]]) {
  console.log(`\n${theme}`);
  for (const [label, fg, bg, min] of pairs(p)) {
    const r = ratio(fg, bg);
    const pass = r >= min;
    if (!pass) fails++;
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (min ${min.toFixed(1)})  ${label}`);
  }
}
console.log(fails ? `\n${fails} pair(s) below target.` : '\nAll pairs meet target.');
process.exit(fails ? 1 : 0);
