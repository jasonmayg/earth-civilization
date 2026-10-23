#!/usr/bin/env node
// Build the English edition of the game from the Chinese source.
//
//   node tools/i18n/i18n.js extract   -> tools/i18n/segments.json (every piece of Chinese text, with context)
//   node tools/i18n/i18n.js build     -> en/index.html (+ report of anything left untranslated)
//   node tools/i18n/i18n.js check     -> exit 1 if en/index.html is stale or still contains Chinese
//
// index.html stays the single source of truth. Text is translated at the level of whole strings and
// template literals, so word order can change ("公元前{0}年" -> "{0} BC"). HTML tags inside strings are
// kept verbatim; only the text between tags (and attribute values) is translated. Code that depends on
// Chinese grammar (number units, name joining, a few regexes) is changed by patches.js.
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'en', 'index.html');
const DIR = __dirname;
const CJK = /[　-〿㐀-鿿＀-￯]/;
const HAN = /[㐀-鿿]/;
const TAG = /<\/?[a-zA-Z][^<>]*>/g;
const ATTR = /([\w-]+)=(["'])([^"']*)\2/g;

// ---------- text runs ----------
// A pattern is text where {n} marks the n-th template expression. Split it into tag / text pieces and
// call fn(run) for every text run (or attribute value) that contains Han characters.
function mapRuns(pattern, fn) {
  let out = '', last = 0;
  const text = t => {
    const m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] && HAN.test(m[2]) ? m[1] + fn(m[2]) + m[3] : t;
  };
  for (const m of pattern.matchAll(TAG)) {
    out += text(pattern.slice(last, m.index));
    out += m[0].replace(ATTR, (a, k, q, v) => (HAN.test(v) ? `${k}=${q}${fn(v)}${q}` : a));
    last = m.index + m[0].length;
  }
  return out + text(pattern.slice(last));
}

// ---------- JS ----------
function scriptRange(html) {
  const a = html.indexOf('<script>');
  const b = html.indexOf('</script>', a);
  return [a + '<script>'.length, b];
}

function walk(node, visit, parent) {
  if (!node || typeof node.type !== 'string') return;
  if (visit(node, parent) === false) return;
  for (const k in node) {
    if (k === 'loc' || k === 'start' || k === 'end') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, visit, node));
    else if (v && typeof v.type === 'string') walk(v, visit, node);
  }
}

// Top-level text nodes: string literals, Han identifiers used as object keys, template literals.
// Templates are handled as one unit (their expressions are processed recursively).
function topNodes(ast) {
  const list = [];
  walk(ast, (n, p) => {
    if (n.type === 'Literal' && typeof n.value === 'string' && HAN.test(n.value)) { list.push(n); return false; }
    if (n.type === 'Identifier' && HAN.test(n.name)) {
      if (p && p.type === 'Property' && p.key === n && !p.computed) { list.push({ ...n, keyOf: p }); return false; }
      throw new Error(`Han identifier used as a variable at ${n.start}: ${n.name}`);
    }
    if (n.type === 'TemplateLiteral') { if (templateHasHan(n)) { list.push(n); return false; } }
    return true;
  });
  return list.sort((a, b) => a.start - b.start);
}
function templateHasHan(t) {
  let has = false;
  walk(t, n => { if ((n.type === 'TemplateElement' && HAN.test(n.value.cooked)) || (n.type === 'Literal' && typeof n.value === 'string' && HAN.test(n.value))) has = true; });
  return has;
}

function render(src, node, tr, base) {
  // Returns the replacement source for one text node; base = offset of src within the script.
  if (node.type === 'Literal') return JSON.stringify(mapRuns(node.value, tr));
  if (node.type === 'Identifier') return JSON.stringify(mapRuns(node.name, tr));
  // TemplateLiteral
  const exprs = node.expressions.map(e => sub(src, e, tr));
  let pattern = '';
  node.quasis.forEach((q, i) => { pattern += q.value.cooked.replace(/[{}]/g, c => (c === '{' ? '⟦' : '⟧')); if (i < exprs.length) pattern += `{${i}}`; });
  const done = mapRuns(pattern, tr);
  const esc = t => t.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/⟦/g, '{').replace(/⟧/g, '}');
  let out = '`', last = 0;
  for (const m of done.matchAll(/\{(\d+)\}/g)) { out += esc(done.slice(last, m.index)) + '${' + exprs[+m[1]] + '}'; last = m.index + m[0].length; }
  return out + esc(done.slice(last)) + '`';
}
function sub(src, node, tr) {
  // Source of an expression with every Han text node inside it replaced.
  const inner = topNodes(node).filter(n => n !== node);
  if (node.type === 'TemplateLiteral' || (node.type === 'Literal' && typeof node.value === 'string')) {
    if (HAN.test(src.slice(node.start, node.end))) return render(src, node, tr);
  }
  let out = '', last = node.start;
  for (const n of inner) {
    if (n.start < last) continue;
    out += src.slice(last, n.start) + (n.keyOf ? render(src, n, tr) : render(src, n, tr));
    last = n.end;
  }
  return out + src.slice(last, node.end);
}

// ---------- HTML outside the script ----------
function mapHtml(html, tr) {
  // Text nodes and attribute values in markup (not inside <style>).
  html = html.replace(/<!--[\s\S]*?-->/g, m => (HAN.test(m) ? '' : m)).replace(/\/\*[\s\S]*?\*\//g, m => (HAN.test(m) ? '' : m));
  const st = html.indexOf('<style'), se = html.indexOf('</style>');
  const doMarkup = part => part.replace(/>([^<]+)</g, (m, t) => (HAN.test(t) ? '>' + mapRuns(t, tr) + '<' : m)).replace(/<[^>]+>/g, tag => tag.replace(ATTR, (a, k, q, v) => (HAN.test(v) ? `${k}=${q}${mapRuns(v, tr)}${q}` : a)));
  if (st < 0) return doMarkup(html);
  return doMarkup(html.slice(0, st)) + html.slice(st, se) + doMarkup(html.slice(se));
}

function transform(html, tr) {
  const [a, b] = scriptRange(html);
  const js = html.slice(a, b);
  const comments = [];
  const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', onComment: comments });
  // Chinese developer comments are dropped from the English build (they are not user-facing).
  const items = topNodes(ast).concat(comments.filter(c => HAN.test(c.value)).map(c => ({ start: c.start, end: c.end, comment: true })))
    .sort((x, y) => x.start - y.start);
  let out = '', last = 0;
  for (const n of items) { if (n.start < last) continue; out += js.slice(last, n.start) + (n.comment ? '' : render(js, n, tr)); last = n.end; }
  out += js.slice(last);
  return mapHtml(html.slice(0, a), tr) + out + mapHtml(html.slice(b), tr);
}

// ---------- commands ----------
function loadTranslations() {
  const tr = {};
  for (const f of fs.readdirSync(path.join(DIR, 'en')).filter(f => f.endsWith('.json')).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, 'en', f), 'utf8'));
    for (const [k, v] of Object.entries(d)) {
      if (k in tr && tr[k] !== v) throw new Error(`Conflicting translations for ${k} in ${f}`);
      tr[k] = v;
    }
  }
  return tr;
}

function extract() {
  const html = require('./patches.js').before(fs.readFileSync(SRC, 'utf8'));
  const seen = new Map();
  let pos = 0;
  transform(html, run => {
    if (!seen.has(run)) seen.set(run, { k: run, n: 0, i: pos++ });
    seen.get(run).n++;
    return run;
  });
  const list = [...seen.values()].sort((a, b) => a.i - b.i).map(({ k, n }) => ({ k, n }));
  fs.writeFileSync(path.join(DIR, 'segments.json'), JSON.stringify(list, null, 1));
  console.log(`${list.length} unique text runs, ${list.reduce((a, x) => a + x.k.length, 0)} characters`);
}

function build({ write = true } = {}) {
  const P = require('./patches.js');
  const html = P.before(fs.readFileSync(SRC, 'utf8'));
  const tr = loadTranslations();
  const missing = new Set();
  let out = transform(html, run => {
    if (run in tr) return tr[run];
    missing.add(run);
    return run;
  });
  out = P.after(out);
  const left = [...out.matchAll(/[㐀-鿿]+/g)].map(m => m[0]);
  if (write) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, out);
  }
  return { out, missing: [...missing], left };
}

const cmd = process.argv[2];
if (cmd === 'extract') extract();
else if (cmd === 'build' || cmd === 'check') {
  const r = build({ write: cmd === 'build' });
  const allowed = new Set(require('./patches.js').ALLOWED_HAN || []);
  const bad = r.left.filter(t => !allowed.has(t));
  console.log(`missing translations: ${r.missing.length}; Chinese left in output: ${bad.length}`);
  if (r.missing.length) console.log(r.missing.slice(0, 30).join('\n'));
  if (bad.length && !r.missing.length) console.log([...new Set(bad)].slice(0, 30).join(' | '));
  if (cmd === 'check') {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== r.out) { console.error('en/index.html is out of date: run node tools/i18n/i18n.js build'); process.exit(1); }
    if (r.missing.length || bad.length) process.exit(1);
  }
} else {
  console.log('usage: i18n.js extract|build|check');
  process.exit(2);
}
