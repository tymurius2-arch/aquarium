"use strict";
// Гибриды. «Крысо-динозавр» = тело, среда и размеры второго существа (динозавр),
// окрас и черты первого (крыса): уши, хвост, пятна, рога, крылья, панцирь…

// ---------- Название ----------
const ADJ_END = /(ый|ий|ой|ая|яя|ое|ее|ые|ие|ья|ье|ьи|ов|ин)$/i;
const cleanName = s => s.replace(/\s*\(.*?\)/g, "").trim();
function mainNoun(words) { const i = words.findIndex(w => !ADJ_END.test(w)); return i < 0 ? 0 : i; }
// «Крыса» → «крысо», «Мышь» → «мыше», «Тигр» → «тигро», «Орёл» → «орло»
const STEM = { "орёл": "орло", "лев": "льво", "осёл": "осло", "козёл": "козло", "муравей": "муравье", "ёж": "еже", "пёс": "псо", "угорь": "угре", "червь": "черве" };
function comboForm(name) {
  const words = cleanName(name).split(/\s+/);
  const raw = words[mainNoun(words)].split("-")[0].toLowerCase();
  if (STEM[raw]) return STEM[raw];
  const soft = /[ьй]$/.test(raw), w = raw.replace(/[аяоеёиыйьуюэ]+$/, "").replace(/ё/g, "е");
  return w + (soft || /[жшчщц]$/.test(w) ? "е" : "о");
}
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
// «Первый», «Древний» и т.п. в названии гибрида не нужны: «Крысо-динозавр», а не «Первый крысо-динозавр»
const SKIP_WORDS = /^(перв|древн|общ)/;
function hybridName(pre, b) {
  let words = cleanName(b.name).toLowerCase().split(/\s+/);
  if (words.length > 1) words = words.filter(w => !SKIP_WORDS.test(w));
  const i = mainNoun(words);
  words[i] = pre + "-" + words[i];
  return capFirst(words.join(" "));
}

// ---------- Какие черты первого существа переходят на тело второго ----------
const TRAITS_FOR = {
  quad: ["ears", "whiskers", "stripes", "spots", "spotc", "patches", "mane", "tusks", "trunk", "horns", "spikes", "plates", "sail",
    "fur", "feathers", "bushy", "rings", "curl", "puff", "tailTip", "cheeks", "panda", "hump", "bigpaws", "collar", "teeth",
    "nose", "eyes", "gills", "face", "frill", "rainbow", "shell", "scutes"],
  fish: ["stripes", "spots", "mottled", "clown", "armor", "piranha", "angler"],
  bird: ["whitehead", "comb", "crest", "parrot", "longtail"],
  worm: ["band", "legs", "bristle"],
  arthro: ["wings", "sting", "claws"],
  ape: ["silver", "hairy", "clothes", "cloak", "tool", "big"],
  biped: ["hairy", "clothes", "cloak", "tool"],
};
const LEGGED = new Set(["quad", "ape", "biped", "arthro"]);
const SWIMMY = new Set(["fish", "worm", "jelly", "octo", "cell", "bacteria", "colony", "snail", "star", "sponge", "coral", "plant"]);

function mixColor(a, b, k = 0.55) {
  const dh = ((a[0] - b[0] + 540) % 360) - 180;
  return [Math.round((b[0] + dh * k + 360) % 360), Math.round(b[1] + (a[1] - b[1]) * k), Math.round(b[2] + (a[2] - b[2]) * k)];
}

const hybridId = (a, b) => "h(" + a.id + "|" + b.id + ")";

function makeHybrid(a, b) {
  const id = hybridId(a, b);
  if (BY_ID[id]) return BY_ID[id];
  const f = { ...b.f }, hy = {};
  const keys = TRAITS_FOR[b.body] || [];
  for (const k of keys) if (a.f[k]) f[k] = a.f[k];

  const aFlies = a.f.fly || (a.body === "arthro" && a.f.wings);
  if (aFlies && !b.f.fly && b.body !== "bird") { hy.wings = a.body === "arthro" ? "bug" : a.f.bat || a.f.ptero ? "skin" : "feather"; f.fly = 1; }
  if ((a.body === "octo" || a.body === "jelly") && a.body !== b.body) hy.tent = 1;
  if ((a.f.spikes || a.f.urchin) && !keys.includes("spikes")) hy.spikes = 1;
  if ((a.f.shell || a.body === "snail") && !keys.includes("shell") && b.body !== "snail") hy.shell = 1;
  if (a.f.horns && !keys.includes("horns")) hy.horns = 1;
  if (a.f.claws && !keys.includes("claws")) hy.claws = 1;
  if (a.f.ears && !keys.includes("ears")) hy.ears = 1;
  if (LEGGED.has(a.body) && SWIMMY.has(b.body)) hy.legs = 1;
  if (a.body === "fish" && b.body !== "fish") hy.fins = 1;
  if (!keys.includes("stripes") && a.f.stripes) hy.pattern = "stripes";
  else if (!keys.includes("spots") && (a.f.spots || a.f.patches)) hy.pattern = "spots";
  // сидячее существо (коралл, губка) в гибриде получает ноги и начинает ходить
  if (f.sessile && !a.f.sessile) { delete f.sessile; hy.legs = 1; }

  const kids = [...new Set([...(a.kids || []), ...(b.kids || [])])].filter(k => k !== a && k !== b);
  const pre = (a.pre ? a.pre + "-" : "") + comboForm(a.hybrid ? BY_ID[a.pb].name : a.name);
  const n = {
    id, parent: a.id, name: hybridName(pre, b), body: b.body, hab: b.hab, diet: b.diet,
    sz: Math.round((a.sz + b.sz) / 2 * 10) / 10, c: mixColor(a.c, b.c),
    desc: `Гибрид: ${a.name} × ${b.name}. Тело и среда от «${b.name}», окрас и черты от «${a.name}».`,
    f, hy, hybrid: true, pa: a.id, pb: b.id, pre, kids, depth: a.depth + 1, desc_n: 0,
  };
  BY_ID[id] = n;
  return n;
}

// Существо по id, включая гибриды вида h(a|b), в том числе вложенные.
function getNode(id) {
  if (!id) return null;
  if (BY_ID[id]) return BY_ID[id];
  if (id.startsWith("h(") && id.endsWith(")")) {
    const inner = id.slice(2, -1);
    let d = 0;
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === "(") d++;
      else if (ch === ")") d--;
      else if (ch === "|" && d === 0) {
        const a = getNode(inner.slice(0, i)), b = getNode(inner.slice(i + 1));
        return a && b ? makeHybrid(a, b) : null;
      }
    }
  }
  return null;
}

// ---------- Рисование черт гибрида поверх обычного тела ----------
// Тело любого типа примерно помещается в эллипс r*0.6 × r*0.45 вокруг (0,0), голова справа.
function drawHybridBack(g, n, r, t, mv) {
  const h = n.hy, c = n.c;
  if (h.wings) {
    const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * (h.wings === "bug" ? 30 : 9)));
    for (const sd of [-1, 1]) {
      g.fillStyle = h.wings === "bug" ? "rgba(220,240,255,.45)" : h.wings === "skin" ? "hsla(20,20%,25%,.88)" : hsl(c, -8, 0.95);
      g.beginPath(); g.moveTo(r * 0.3, sd * r * 0.2);
      g.quadraticCurveTo(r * 0.15, sd * r * 1.35 * flap, -r * 0.35, sd * r * 1.3 * flap);
      g.quadraticCurveTo(-r * 0.3, sd * r * 0.55, -r * 0.25, sd * r * 0.15); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = r * 0.025; g.stroke();
    }
  }
  if (h.tent) for (let i = 0; i < 6; i++) wavy(g, -r * 0.35, (i - 2.5) * r * 0.13, r * 1.3, r * 0.25, t * 4 + i, r * 0.09, r * 0.02, hsl(c, -6, 0.85), 10);
  if (h.legs) {
    for (const [x, sd, ph] of [[r * 0.35, -1, 0], [r * 0.35, 1, Math.PI], [-r * 0.35, -1, Math.PI], [-r * 0.35, 1, 0]]) {
      const sw = Math.sin(t * 9 + ph) * r * 0.18 * (0.3 + 0.7 * mv);
      line(g, [x, sd * r * 0.2, x + sw, sd * r * 0.75], r * 0.14, hsl(c, -18));
      g.fillStyle = hsl(c, -24); ell(g, x + sw, sd * r * 0.78, r * 0.12, r * 0.09); g.fill();
    }
  }
  if (h.fins) {
    for (const sd of [-1, 1]) { g.fillStyle = hsl(c, -10, 0.85); ell(g, r * 0.1, sd * r * 0.62, r * 0.35, r * 0.12, sd * 0.6); g.fill(); }
    g.fillStyle = hsl(c, -10, 0.9); g.beginPath(); g.moveTo(-r * 0.6, 0); g.lineTo(-r * 1.15, -r * 0.4); g.lineTo(-r * 1.0, 0); g.lineTo(-r * 1.15, r * 0.4); g.closePath(); g.fill();
  }
}

function drawHybridFront(g, n, r, t) {
  const h = n.hy, c = n.c;
  if (h.pattern) {
    g.save(); ell(g, -r * 0.05, 0, r * 0.55, r * 0.4); g.clip();
    if (h.pattern === "stripes") for (let i = -3; i <= 3; i++) line(g, [i * r * 0.16, -r * 0.45, i * r * 0.16 + r * 0.06, r * 0.45], r * 0.06, "rgba(20,15,10,.45)");
    else for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(20,15,10,.45)"; circ(g, Math.cos(i * 2.39) * r * 0.45 * Math.sqrt(i / 10), Math.sin(i * 2.39) * r * 0.35 * Math.sqrt(i / 10), r * 0.06); g.fill(); }
    g.restore();
  }
  if (h.shell) {
    g.fillStyle = shade(g, -r * 0.15, 0, r * 0.5, [35, 45, 40], 0.95); ell(g, -r * 0.15, 0, r * 0.48, r * 0.4); g.fill();
    g.strokeStyle = "hsla(35,45%,22%,.8)"; g.lineWidth = r * 0.03;
    for (const [x, y] of [[-r * 0.15, 0], [-r * 0.4, -r * 0.18], [-r * 0.4, r * 0.18], [r * 0.08, -r * 0.18], [r * 0.08, r * 0.18]]) { g.beginPath(); for (let s = 0; s <= 6; s++) { const a = s / 6 * TAU; g.lineTo(x + Math.cos(a) * r * 0.12, y + Math.sin(a) * r * 0.12); } g.stroke(); }
  }
  if (h.spikes) for (let i = 0; i < 26; i++) {
    const a = i / 26 * TAU, x = Math.cos(a) * r * 0.5 - r * 0.1, y = Math.sin(a) * r * 0.4;
    line(g, [x, y, x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.28], r * 0.045, i % 2 ? "#3b2c22" : "#d8c8b0");
  }
  if (h.horns) for (const sd of [-1, 1]) line(g, [r * 0.55, sd * r * 0.1, r * 0.8, sd * r * 0.3, r * 1.0, sd * r * 0.25], r * 0.06, "#e8dcc0");
  if (h.ears) for (const sd of [-1, 1]) { g.fillStyle = hsl(c, -15); g.beginPath(); g.moveTo(r * 0.55, sd * r * 0.12); g.lineTo(r * 0.3, sd * r * 0.45); g.lineTo(r * 0.42, sd * r * 0.08); g.fill(); }
  if (h.claws) for (const sd of [-1, 1]) {
    line(g, [r * 0.4, sd * r * 0.25, r * 0.75, sd * r * 0.5], r * 0.09, hsl(c, -10));
    g.fillStyle = shade(g, r * 0.9, sd * r * 0.5, r * 0.2, c); ell(g, r * 0.9, sd * r * 0.5, r * 0.22, r * 0.12, sd * 0.2); g.fill();
  }
}
