// Code changes the English edition needs beyond translated text.
//
// `before` runs on the Chinese source BEFORE text is translated: it rewrites code that builds words out of
// Chinese characters (name generators, number units, year formats, keyword matching). Chinese literals left
// in the replacement code are still translated afterwards, through the same dictionary, so names stay
// consistent with the data. `after` runs on the finished English page (storage keys, fonts, the language
// switch, leftover CJK punctuation).
//
// Every patch must match: a patch that matches nothing means index.html changed underneath it, and the
// build stops instead of silently shipping half-Chinese code.
'use strict';

const helpers = `
// ---- English edition helpers (added by tools/i18n/patches.js) ----
const capW = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const zhGiven = () => pick(GIVEN_ZH) + (R() < 0.4 ? pick(GIVEN_ZH).toLowerCase() : '');
const popEN = m => m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 1 : 2) + ' billion' : m >= 10 ? Math.round(m) + ' million' : m >= 1 ? m.toFixed(1) + ' million' : (Math.max(1, Math.round(m * 100)) * 10000).toLocaleString('en-US');
const fmtArea = v => v >= 100 ? (v / 100).toFixed(v >= 1000 ? 0 : 1) + ' million km²' : (Math.round(v) * 10000).toLocaleString('en-US') + ' km²';
`;

const BEFORE = [
  // ---------- names ----------
  [/const POOLS = \{[\s\S]*?\n\};/, `const POOLS = {
  1: ['Xia', 'Shang', 'Zhou', 'Qin', 'Han', 'Tang', 'Song', 'Ming', 'Jin', 'Yan', 'Zhao', 'Qi', 'Chu', 'Wu', 'Yue', 'Shu', 'Wei', 'Liao', 'Ying', 'Bo', 'Fu', 'Ning', 'Jing', 'Kang', 'Tai', 'Yin', 'Lu', 'Zheng'],
  2: ['ma', 'gad', 'ha', 'mau', 'rya', 'gup', 'ta', 'ku', 'sha', 'cho', 'la', 'pan', 'dya', 'vi', 'ja', 'ya', 'na', 'ga', 'ra', 'bha', 'de', 'sin', 'dhu', 'vas'],
  3: ['as', 'sur', 'ba', 'by', 'lon', 'su', 'mer', 'el', 'am', 'hat', 'ti', 'me', 'di', 'par', 'sa', 'tha', 'ak', 'kad', 'ur', 'uk', 'sas', 'phoe', 'ni', 'cia'],
  4: ['xiong', 'nu', 'tur', 'kut', 'ru', 'ran', 'xian', 'bei', 'mon', 'gol', 'khwa', 'raz', 'kash', 'gar', 'sa', 'yan', 'wu', 'sun', 'yue', 'zhi', 'kang', 'ju'],
  5: ['chen', 'la', 'ang', 'kor', 'cham', 'pa', 'sri', 'vi', 'ja', 'ya', 'gan', 'si', 'am', 'ma', 'hit', 'ayu', 'tha'],
  6: ['ro', 'ma', 'gre', 'cia', 'gal', 'li', 'fran', 'ka', 'ger', 'bri', 'ta', 'vi', 'king', 'goth', 'sla', 'vo', 'nor', 'lom', 'bar', 'cel', 'prus', 'sax', 'ost'],
  7: ['ku', 'sha', 'ak', 'sum', 'ma', 'li', 'son', 'ghai', 'nu', 'bi', 'zim', 'ba', 'bwe', 'kon', 'go', 'e', 'thi', 'swa', 'hi', 'zu', 'lu'],
  8: ['ma', 'ya', 'az', 'tec', 'ol', 'mec', 'to', 'ti', 'ca', 'wa', 'na', 'ho', 'pi', 'che', 'chi', 'mu', 'is', 'can'],
  9: ['in', 'ca', 'wa', 'ri', 'ti', 'na', 'ku', 'mo', 'che', 'cha', 'vin', 'chi', 'mu', 'ma', 'pu', 'gua', 'ra', 'ni'],
  10: ['ma', 'o', 'ri', 'ta', 'hi', 'ti', 'sa', 'mo', 'a', 'ton', 'ga', 'va', 'nu', 'tu', 'ku', 'la', 'pa', 'pi'],
  11: ['frost', 'rime', 'hel', 'nor', 'skad', 'vin']
};${helpers}`],
  [`    if (reg === 1) s = t < 12 ? pick(pool) : pick(pool) + pick(pool);
    else { const n = 2 + (R() < 0.45 ? 1 : 0); s = ''; let prev = ''; for (let k = 0; k < n; k++) { let c = pick(pool); if (c === prev) c = pick(pool); s += c; prev = c; } }`,
   `    if (reg === 1) s = t < 12 ? pick(pool) : pick(pool) + pick(pool).toLowerCase();
    else { const n = 2 + (R() < 0.45 ? 1 : 0); s = ''; let prev = ''; for (let k = 0; k < n; k++) { let c = pick(pool); if (c === prev) c = pick(pool); s += c; prev = c; } s = capW(s.toLowerCase()); }`],
  [`const s = '新' + pick(pool) + pick(pool); S.usedNames.add(s); return s;`, `const s = 'New ' + capW((pick(pool) + pick(pool)).toLowerCase()); S.usedNames.add(s); return s;`],
  ['const civName = c => c.base + govTitle(c);', 'const civName = c => { const t = govTitle(c); return t ? c.base + \' \' + t : c.base; };'],
  [/function rulerName\(c\) \{[\s\S]*?\n\}/, `function rulerName(c) {
  const pool = POOLS[c.region] || POOLS[6], t = c.tech, nm = () => capW((pick(pool) + pick(pool)).toLowerCase());
  if (t < 1) return 'Chief ' + nm();
  if (c.nomad) return nm() + ' Khan';
  if (t >= 6) return (c.style === '帝国' ? 'Emperor ' : c.style === '联合王国' ? 'Prime Minister ' : 'President ') + nm();
  if (c.region === 1) return 'Emperor ' + pick(RULER_POST) + ' of ' + c.base;
  return nm() + ' ' + pick(ORD);
}`],
  [`const RULER_POST = '武文景昭宣明章和仁英神高世太'.split('');`, `const RULER_POST = ['Wu', 'Wen', 'Jing', 'Zhao', 'Xuan', 'Ming', 'Zhang', 'He', 'Ren', 'Ying', 'Shen', 'Gao', 'Shi', 'Tai'];`],
  [`const REL_B = ['教', '道', '宗', '会'];`, `const REL_B = ['Faith', 'Way', 'Order', 'Society'];`],
  [`name = parentRel != null ? (R() < 0.5 ? '新' : '正') + S.rels[parentRel].name : pick(REL_A) + pick(REL_B);`,
   `name = parentRel != null ? (R() < 0.5 ? 'New ' : 'Orthodox ') + S.rels[parentRel].name : pick(REL_B) + ' of ' + pick(REL_A);`],
  [`const SURNAMES = '刘李赵王张陈杨孙曹司马诸葛周吴郑冯卫韩魏萧高崔卢裴'.split('');`,
   `const SURNAMES = ['Liu', 'Li', 'Zhao', 'Wang', 'Zhang', 'Chen', 'Yang', 'Sun', 'Cao', 'Sima', 'Zhuge', 'Zhou', 'Wu', 'Zheng', 'Feng', 'Wei', 'Han', 'Xiao', 'Gao', 'Cui', 'Lu', 'Pei'];`],
  [`const GIVEN_ZH = '政彻恒启秀备权操昭睿炎坚策瑜亮懿植丕彰瓒绍术表璋谦邈攸诩嘉统'.split('');`,
   `const GIVEN_ZH = ['Zheng', 'Che', 'Heng', 'Qi', 'Xiu', 'Bei', 'Quan', 'Cao', 'Zhao', 'Rui', 'Yan', 'Jian', 'Ce', 'Yu', 'Liang', 'Yi', 'Zhi', 'Pi', 'Zhang', 'Zan', 'Shao', 'Shu', 'Biao', 'Qian', 'Miao', 'You', 'Xu', 'Jia', 'Tong'];`],
  [`  if (c.region === 1) { const sn = c.dyn && c.dyn.sn ? c.dyn.sn : pick(SURNAMES); return sn + pick(GIVEN_ZH) + (R() < 0.4 ? pick(GIVEN_ZH) : ''); }
  if (c.nomad || c.region === 4) return pick(pool) + pick(pool) + (R() < 0.5 ? pick(pool) : '');
  return pick(pool) + pick(pool) + (R() < 0.4 ? pick(pool) : '');`,
   `  if (c.region === 1) { const sn = c.dyn && c.dyn.sn ? c.dyn.sn : pick(SURNAMES); return sn + ' ' + zhGiven(); }
  if (c.nomad || c.region === 4) return capW((pick(pool) + pick(pool) + (R() < 0.5 ? pick(pool) : '')).toLowerCase());
  return capW((pick(pool) + pick(pool) + (R() < 0.4 ? pick(pool) : '')).toLowerCase());`],
  [`  if (c.region === 1) { const s = sn || pick(SURNAMES); return { n: s + '氏', sn: s, since: Math.round(S.year) }; }
  const pool = POOLS[c.region] || POOLS[6];
  return { n: pick(pool) + pick(pool) + (c.nomad ? '部' : '家'), since: Math.round(S.year) };`,
   `  if (c.region === 1) { const s = sn || pick(SURNAMES); return { n: 'House of ' + s, sn: s, since: Math.round(S.year) }; }
  const pool = POOLS[c.region] || POOLS[6], nm = capW((pick(pool) + pick(pool)).toLowerCase());
  return { n: c.nomad ? nm + ' clan' : 'House of ' + nm, since: Math.round(S.year) };`],
  [`if (c.region === 1) m.name = pick(SURNAMES) + pick(GIVEN_ZH) + (R() < 0.4 ? pick(GIVEN_ZH) : '');`, `if (c.region === 1) m.name = pick(SURNAMES) + ' ' + zhGiven();`],
  [`c.dyn = dynastyName(c, c.region === 1 ? m.name[0] : null);`, `c.dyn = dynastyName(c, c.region === 1 ? m.name.split(' ')[0] : null);`],
  [`c.dyn = { n: SURN[r.n] + '氏', sn: SURN[r.n], since: Math.round(S.year) };`, `c.dyn = { n: 'House of ' + SURN[r.n], sn: SURN[r.n], since: Math.round(S.year) };`],
  // Single-character name parts are romanized here rather than through the shared dictionary.
  [/  zh: \[\['王', '李'[^\n]*\n  ja: [^\n]*\n  ko: [^\n]*\n/, `  zh: [['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Hu', 'Zhu', 'Gao', 'Lin', 'He', 'Guo', 'Ma', 'Luo'], ['Mingyuan', 'Zhiqiang', 'Jianhua', 'Xiaodong', 'Wenbo', 'Haifeng', 'Siyuan', 'Yuhang', 'Jiaqi', 'Yutong', 'Guodong', 'Zhenyu', 'Jiayi', 'Zimo', 'Yiming', 'Ruoxi']],
  ja: [['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'], ['Ken\\'ichi', 'Naoki', 'Takuya', 'Miho', 'Yuki', 'Daisuke', 'Shota', 'Keiko', 'Yuko', 'Koji']],
  ko: [['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim'], ['Min-jun', 'Ji-hyun', 'Sung-ho', 'Soo-yeon', 'Jae-won', 'Hyun-woo', 'Eun-jung', 'Dong-wook']],
`],
  [/  sea: \[\['阿里', '妮娜'[^\n]*\n/, `  sea: [['Ali', 'Nina', 'Ben', 'Supa', 'Nguyen Van', 'Le Thi', 'Datu', 'Maya'], ['Santos', 'Hadi', 'Somchai', 'Hoang', 'Phan', 'Rahman', 'Vera', 'Gunawan']],\n`],
  [`if (cu === 'zh' || cu === 'ja' || cu === 'ko') return pick(p[0]) + pick(p[1]);
  return pick(p[0]) + '·' + pick(p[1]);`, `return pick(p[0]) + ' ' + pick(p[1]);`],
  [/  kr: \{ f: \['王'[^\n]*\n  jp: [^\n]*\n/, `  kr: { f: ['Wang', 'Yi', 'Kim', 'Park', 'Go', 'Choi'], g: 1 }, vn: { f: ['Ly', 'Tran', 'Le', 'Nguyen', 'Dinh', 'Ngo'], g: 1 },
  jp: { f: ['Minamoto', 'Taira', 'Fujiwara', 'Ashikaga', 'Hojo', 'Tokugawa', 'Oda', 'Otomo'], mid: ['Yoshi', 'Ie', 'Yori', 'Nobu', 'Hide', 'Toki', 'Uji', 'Masa'], end: ['mitsu', 'teru', 'tomo', 'naga', 'yasu', 'mune', 'tsuna', 'shige'] },
`],
  [`  if (P.g) return pick(P.f) + pick(GIVEN_ZH) + (R() < 0.5 ? pick(GIVEN_ZH) : '');
  if (P.mid) return pick(P.f) + pick(P.mid) + pick(P.end);
  if (P.b) return pick(P.a) + (cu === 'tb' ? '' : '·') + pick(P.b);
  if (P.s) return pick(P.a) + (typeof P.s === 'string' ? P.s : pick(P.s));
  if (P.ord) return pick(P.a) + pick(ORDN);`,
   `  if (P.g) return pick(P.f) + ' ' + zhGiven();
  if (P.mid) return pick(P.f) + ' ' + pick(P.mid) + pick(P.end);
  if (P.b) { const a = pick(P.a); let b = pick(P.b); for (let k = 0; k < 4 && b === a; k++) b = pick(P.b); return a + ' ' + b; }
  if (P.s) return pick(P.a) + (typeof P.s === 'string' ? ' ' + P.s : pick(P.s));
  if (P.ord) return pick(P.a) + ' ' + pick(ORDN);`],
  [/const SURN = \{[\s\S]*?\};\n/, src => src
    .replace(/'嬴'/g, "'Ying'").replace(/'刘'/g, "'Liu'").replace(/'王'/g, "'Wang'").replace(/'曹'/g, "'Cao'").replace(/'孙'/g, "'Sun'")
    .replace(/'司马'/g, "'Sima'").replace(/'萧'/g, "'Xiao'").replace(/'陈'/g, "'Chen'").replace(/'拓跋'/g, "'Tuoba'").replace(/'元'/g, "'Yuan'")
    .replace(/'高'/g, "'Gao'").replace(/'宇文'/g, "'Yuwen'").replace(/'杨'/g, "'Yang'").replace(/'李'/g, "'Li'").replace(/'朱'/g, "'Zhu'")
    .replace(/'石'/g, "'Shi'").replace(/'郭'/g, "'Guo'").replace(/'赵'/g, "'Zhao'").replace(/'耶律'/g, "'Yelü'").replace(/'完颜'/g, "'Wanyan'")
    .replace(/'孛儿只斤'/g, "'Borjigin'").replace(/'爱新觉罗'/g, "'Aisin Gioro'").replace(/'姒'/g, "'Si'").replace(/'子'/g, "'Zi'")
    .replace(/'姬'/g, "'Ji'").replace(/'芈'/g, "'Mi'").replace(/'田'/g, "'Tian'").replace(/'韩'/g, "'Han'").replace(/'魏'/g, "'Wei'")
    .replace(/'苻'/g, "'Fu'").replace(/'姚'/g, "'Yao'").replace(/'慕容'/g, "'Murong'").replace(/'钱'/g, "'Qian'").replace(/'孟'/g, "'Meng'")
    .replace(/'扶余'/g, "'Buyeo'").replace(/'金'/g, "'Kim'").replace(/'黎'/g, "'Le'").replace(/'阮'/g, "'Nguyen'").replace(/'大'/g, "'Dae'")],
  // ---------- country names built from parts ----------
  [/const FULL_SUFFIX = \[[^\n]*\n/, ''],
  [`const isFull0 = n => FULL_SET.has(n) || FULL_SUFFIX.some(s => n.endsWith(s)) || MOD_NAMES.has(n) || /埃及$|罗斯$|斯基泰$|萨尔马提亚$/.test(n);
const isFull = n => isFull0(n) || isFull0(n.replace(/^(北|南|东|西|后|新)/, ''));`,
   `const FULL_WORDS = /\\b(dynasty|kingdom|kingdoms|empire|khanate|republic|federation|culture|civilization|shogunate|regime|tribes?|city-states?|league|confederacy|confederation|colony|colonies|viceroyalty|governorate|territory|caliphate|sultanate|emirate|beylik|regency|company|state|states|union|horde|people|realm|period|raj|commonwealth|protectorate)\\b|^(the|kingdom|empire|republic)\\b/i;
const isFull0 = n => FULL_SET.has(n) || FULL_WORDS.test(n) || MOD_NAMES.has(n) || /Egypt$|Rus$|Scythians?$|Sarmatians?$/.test(n);
const isFull = n => isFull0(n) || isFull0(n.replace(/^(Northern|Southern|Eastern|Western|Later|New) /, ''));`],
  [`const DIR_PFX = ['北', '南', '东', '西', '后', '新'];`, `const DIR_PFX = ['Northern ', 'Southern ', 'Eastern ', 'Western ', 'Later ', 'New '];`],
  [`const m = p + n.replace(/^(北|南|东|西|后|新)/, '');`, `const m = p + n.replace(/^(Northern|Southern|Eastern|Western|Later|New) /, '');`],
  [`const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '东' : '西') : (dy > 0 ? '南' : '北');
  let name = dir + p.base; if (S.usedNames.has(name)) name = '新' + name + '共和国';`,
   `const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'East ' : 'West ') : (dy > 0 ? 'South ' : 'North ');
  let name = dir + p.base; if (S.usedNames.has(name)) name = 'New ' + name + ' Republic';`],
  [`if (best && bd <= 25) return best.replace(/北$|东$|西$|南$/, '');`, `if (best && bd <= 25) return best.replace(/ (North|East|West|South)$/, '');`],
  // ---------- numbers and dates ----------
  [`function fmtMoney(b) { return b >= 1000 ? (b / 1000).toFixed(b >= 10000 ? 1 : 2) + ' 万亿美元' : (b * 10).toFixed(0) + ' 亿美元'; }`,
   `function fmtMoney(b) { return b >= 1000 ? '$' + (b / 1000).toFixed(b >= 10000 ? 1 : 2) + ' trillion' : '$' + Math.round(b) + ' billion'; }`],
  [`const fmtPop = m => m >= 100 ? (m / 100).toFixed(m >= 1000 ? 0 : 1) + ' 亿' : Math.max(1, Math.round(m * 100)) + ' 万';`,
   `const fmtPop = popEN;`],
  [`function fmtTroops(v, c) { return c.modernCiv ? \`约 \${Math.round(v * 4)} 万人\` : \`约 \${Math.round(v * 0.6 * 10) / 10} 万人\`; }`,
   `function fmtTroops(v, c) { const n = c.modernCiv ? Math.round(v * 4) * 10000 : Math.round(v * 6000); return 'about ' + n.toLocaleString('en-US') + ' troops'; }`],
  ["`人口超过 ${v >= 100 ? v / 100 + ' 亿' : v * 100 + ' 万'}`", "`人口超过 ${popEN(v)}`"],
  ['<b>${areaOf(c)}</b>万平方公里', '<b>${fmtArea(areaOf(c))}</b>Territory'],
  [/\$\{([^{}]+?)\} ?万平方公里/g, '${fmtArea($1)}'],
  ['const fmtYear = y => y < 0 ? `公元前 ${-y} 年` : `公元 ${y} 年`;', "const fmtYear = y => y < 0 ? `${-y} BC` : `AD ${y}`;"],
  [/'公元前 ?' \+ \(-((?:[^()]|\([^()]*\))+)\)/g, "(-$1) + ' BC'"],
  [/'公元 ?' \+ /g, "'AD ' + "],
  [/'前' \+ \(-((?:[^()]|\([^()]*\))+)\)/g, "(-$1) + ' BC'"],
  [/\$\{'一二三四'\[([^\]]+)\]\}/g, '${$1 + 1}'],
  // ---------- AI rivals pick options by keyword ----------
  [/kw: \['开战'[^\]]*\], neg: \[[^\]]*\]/, "kw: ['war', 'attack', 'campaign', 'suppress', 'punish', 'lead the army', 'mobiliz', 'weaken', 'army', 'military', 'deter'], neg: ['peace', 'yield', 'tribute', 'amnesty']"],
  [/kw: \['互市'[^\]]*\], neg: \[[^\]]*\]/, "kw: ['trade', 'market', 'merchant', 'commerce', 'open', 'fleet', 'fund', 'treasury'], neg: ['close', 'restrict']"],
  [/kw: \['科技'[^\]]*\], neg: \[[^\]]*\]/, "kw: ['tech', 'learn', 'scholar', 'observ', 'research', 'r&d', 'promote', 'experiment', 'physician', 'calendar', 'progress'], neg: ['secret', 'ban']"],
  [/kw: \['稳定'[^\]]*\], neg: \[[^\]]*\]/, "kw: ['stabil', 'relief', 'calm', 'generous', 'people', 'maintain', 'transition', 'wonder'], neg: ['war']"],
  [/kw: \['结盟'[^\]]*\], neg: \[[^\]]*\]/, "kw: ['alliance', 'ally', 'marriage', 'marry', 'peace', 'mediat', 'envoy', 'joint', 'relations'], neg: ['expel', 'declare war']"],
  ['for (const o of card.opts) { const t = o.l + o.d;', 'for (const o of card.opts) { const t = (o.l + o.d).toLowerCase();'],
  ['建立起定居的${govTitle(c)}', "建立起定居的${(govTitle(c) || 'state').toLowerCase()}"],
  ['`${h.n}${h.t}。`', '`${h.n} ${h.t}.`'],
  ["${lv ? '升级' : '兴建'}了", "${lv ? 'upgraded' : 'built'}了"],
  // ---------- regexes that read Chinese text ----------
  ["(k === 'person' && /君主/.test(t))", "(k === 'person' && /^Monarch /.test(t))"],
  ['/^达成成就/.test(l.t)', '/^Achievement unlocked/.test(l.t)'],
  ['/−|下降/.test(e.d)', '/−|down|lower|slower|drop|worse/i.test(e.d)'],
  // Mobile tab bar: a one-character glyph plus a label in Chinese; one word in English.
  ['<b>势</b>世界</button>', '<b>World</b></button>'], ['<b>国</b>国家<span', '<b>Country</b><span'],
  ['<b>档</b>档案</button>', '<b>Dossier</b></button>'], ['<b>史</b>编年<span', '<b>Chronicle</b><span'],
  // ---------- page ----------
  ['<html lang="zh-CN">', '<html lang="en">'],
  [/<script id="langgate">[\s\S]*?<\/script>\n/, ''],
  ['<link rel="alternate" hreflang="en" href="en/">', '<link rel="alternate" hreflang="zh" href="../?lang=zh">'],
  ["'ecg.save.'", "'ecg.en.save.'"],
];

const AFTER = [
  // Seals were designed for one or two Chinese characters; English words need a horizontal label.
  [/<\/style>/, `.seal,.cseal{width:auto!important;min-width:48px;height:auto!important;padding:7px 10px;font-family:var(--serif)!important;font-size:13px!important;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.seal.two{writing-mode:horizontal-tb!important;line-height:1.2;letter-spacing:.08em}
.hseal{width:auto;padding:0 .45em;font-size:.5em;letter-spacing:.05em;text-transform:uppercase}
#mt{padding-right:84px}
h1,.modal h3,.rhead h2,aside h2,.yearbox .era{letter-spacing:.01em}
.modal h3{font-size:22px;line-height:1.25}
</style>`],
  [`<a class="langlink" href="en/" lang="en" hreflang="en" onclick="try{localStorage.setItem('ecg.lang','en')}catch(e){}">English</a>`,
   `<a class="langlink" href="../?lang=zh" lang="zh" hreflang="zh" onclick="try{localStorage.setItem('ecg.lang','zh')}catch(e){}">中文</a>`],
  ['.missions li.done::after{content:"成";', '.missions li.done::after{content:"✓";'],
  [`<a class="btn" id="langbtn" href="en/" lang="en" hreflang="en" title="English" onclick="try{localStorage.setItem('ecg.lang','en')}catch(e){}">EN</a>`,
   `<a class="btn" id="langbtn" href="../?lang=zh" lang="zh" hreflang="zh" title="中文版" onclick="try{localStorage.setItem('ecg.lang','zh')}catch(e){}">中文</a>`],
  [/:root\{--brush:"Ma Shan Zheng","Zhi Mang Xing",/, ':root{--brush:'],
  [/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Serif\+SC[^"]*" rel="stylesheet">/, '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@500;700;900&family=Noto+Sans:wght@400;500;700&display=swap" rel="stylesheet">'],
  ['--serif:"Noto Serif SC",', '--serif:"Noto Serif","Noto Serif SC",'],
  ['--sans:"Noto Sans SC",', '--sans:"Noto Sans","Noto Sans SC",'],
];

const PUNCT = { '，': ', ', '。': '. ', '、': ', ', '：': ': ', '；': '; ', '！': '! ', '？': '? ', '（': ' (', '）': ') ', '「': '"', '」': '"', '《': '"', '》': '"', '“': '"', '”': '"', '‘': "'", '’': "'", '　': ' ' };

function apply(src, list, stage) {
  for (const [find, rep] of list) {
    if (find instanceof RegExp) {
      const re = find.global ? find : new RegExp(find.source, find.flags);
      if (!re.test(src)) throw new Error(`[${stage}] patch did not match: ${find}`);
      re.lastIndex = 0;
      src = src.replace(re, rep);
    } else {
      if (!src.includes(find)) throw new Error(`[${stage}] patch did not match: ${find.slice(0, 80)}`);
      src = src.split(find).join(rep);
    }
  }
  return src;
}

module.exports = {
  before: src => apply(src, BEFORE, 'before'),
  after: out => {
    out = apply(out, AFTER, 'after');
    // Leftover full-width punctuation (joins like .join('、')) becomes ASCII.
    return out.replace(/[，。、：；！？（）「」《》“”‘’　]/g, ch => PUNCT[ch]);
  },
  ALLOWED_HAN: ['中文', '中文版'],
};
