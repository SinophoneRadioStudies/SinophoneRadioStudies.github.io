/* Full-text search over the transcribed run of 無線電問答彙刊.

   Chinese queries use normalised bigrams: every character is first folded to a
   single canonical glyph, then a two-character sliding window is taken. A query
   typed in simplified characters therefore takes exactly the same path as one
   typed in traditional characters, so cross-script search is the default rather
   than an option. The periodicals are printed in traditional characters, which
   makes this a hard requirement rather than a nicety.

   Tokenisation and sharding here must match scripts/build_site.py exactly. If the
   two ever drift apart, the client looks for tokens in the wrong shard: it finds
   nothing, every time, and reports no error at all. */
/* Base paths are injected by the page so the site keeps working under a
   non-empty baseurl (a fork served from a project page, for instance). */
const QA_BASE = window.QA_BASE || "/assets/qa/";
const QA_READ = window.QA_READ || "/periodicals/radio-qa/read/";
const SHARDS = 128;
let NORM = null,
  CAT = null,
  shardCache = {},
  docCache = {};

async function loadNorm() {
  if (NORM) return NORM;
  const groups = await (await fetch(QA_BASE + "variants.min.json")).json();
  NORM = {};
  for (const g of groups) for (const c of g) NORM[c] = g[0];
  return NORM;
}
async function loadCat() {
  if (!CAT) CAT = await (await fetch(QA_BASE + "catalog.json")).json();
  return CAT;
}
async function getDoc(id) {
  if (!(id in docCache)) docCache[id] = fetch(QA_BASE + "doc/" + id + ".json").then((r) => r.json());
  return docCache[id];
}
const normalize = (s) => [...s].map((c) => (NORM && NORM[c]) || c).join("");

async function shardOf(tok) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tok));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return parseInt(hex.slice(0, 4), 16) % SHARDS;
}
async function getShard(i) {
  if (!(i in shardCache)) shardCache[i] = fetch(QA_BASE + "idx/" + i + ".json").then((r) => r.json());
  return shardCache[i];
}

/* Query-side tokenisation. Unlike the index side, single characters of a longer
   word are not added: doing so would turn 無線電 into 无 AND 线 AND 电 and lose
   all precision. */
function tokenize(q) {
  const t = new Set();
  for (const m of q.toLowerCase().matchAll(/[a-z][a-z'\-]{1,}/g)) t.add(m[0]);
  for (const m of q.matchAll(/[㐀-鿿]+/g)) {
    const n = normalize(m[0]);
    if (n.length === 1) {
      t.add(n);
      continue;
    }
    for (let i = 0; i < n.length - 1; i++) t.add(n.slice(i, i + 2));
  }
  return [...t];
}

const key = (d, p) => d * 100000 + p;

async function hitsOf(word) {
  const toks = tokenize(word);
  if (!toks.length) return null;
  let acc = null;
  for (const tk of toks) {
    const sh = await getShard(await shardOf(tk));
    const s = new Set((sh[tk] || []).map(([d, p]) => key(d, p)));
    acc = acc === null ? s : new Set([...acc].filter((x) => s.has(x)));
    if (!acc.size) break;
  }
  return acc;
}

/* Chinese words of three or more characters are checked against the page text.
   The index stores two-character windows, so 收音機 is looked up as 收音 AND 音機;
   a page carrying those two pairs in unrelated places would otherwise count as a
   hit even though the word itself never appears. Two-character words are exact by
   construction and need no check. */
function needsVerify(w) {
  return (w.match(/[㐀-鿿]/g) || []).length >= 3;
}

async function verify(word, hits) {
  const cat = await loadCat();
  const want = normalize(word);
  const out = new Set();
  const byDoc = new Map();
  for (const k of hits) {
    const d = Math.floor(k / 100000);
    if (!byDoc.has(d)) byDoc.set(d, []);
    byDoc.get(d).push(k % 100000);
  }
  for (const [d, ps] of byDoc) {
    const doc = await getDoc(cat[d].id);
    for (const p of ps) if (normalize(doc.pages[p].t).includes(want)) out.add(key(d, p));
  }
  return out;
}

/* Query syntax: space = AND, `|` = OR, leading `-` = exclude. These are the basic
   operations of a search box, not advanced features, so they work by default. */
async function search(q) {
  const parts = q.trim().split(/\s+/);
  let acc = null;
  const excl = [];
  for (const part of parts) {
    if (part.startsWith("-") && part.length > 1) {
      excl.push(part.slice(1));
      continue;
    }
    let s = null;
    for (const alt of part.split("|")) {
      if (!alt) continue;
      let h = await hitsOf(alt);
      if (h && needsVerify(alt)) h = await verify(alt, h);
      if (!h) continue;
      s = s === null ? h : new Set([...s, ...h]);
    }
    if (s === null) s = new Set();
    acc = acc === null ? s : new Set([...acc].filter((x) => s.has(x)));
    if (!acc.size) break;
  }
  for (const e of excl) {
    let h = await hitsOf(e);
    if (h && needsVerify(e)) h = await verify(e, h);
    if (h) acc = new Set([...acc].filter((x) => !h.has(x)));
  }
  return acc || new Set();
}

function snippet(text, words) {
  const n = normalize(text);
  let at = -1,
    len = 0;
  for (const w of words) {
    const i = n.indexOf(normalize(w));
    if (i >= 0 && (at < 0 || i < at)) {
      at = i;
      len = w.length;
    }
  }
  if (at < 0) {
    at = 0;
    len = 0;
  }
  const s = Math.max(0, at - 60),
    e = Math.min(text.length, at + len + 60);
  const esc = (x) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  return (
    (s > 0 ? "…" : "") +
    esc(text.slice(s, at)) +
    (len ? "<mark>" + esc(text.slice(at, at + len)) + "</mark>" : "") +
    esc(text.slice(at + len, e)) +
    (e < text.length ? "…" : "")
  );
}

const PAGE_SIZE = 50;
let lastHits = [],
  lastWords = [],
  shown = 0;

async function renderMore() {
  const cat = await loadCat();
  const box = document.getElementById("qa-results");
  for (const k of lastHits.slice(shown, shown + PAGE_SIZE)) {
    const d = Math.floor(k / 100000),
      p = k % 100000;
    const doc = await getDoc(cat[d].id);
    const el = document.createElement("a");
    el.className = "qa-hit";
    el.href = QA_READ + "?d=" + encodeURIComponent(cat[d].id) + "&p=" + p;
    el.innerHTML =
      '<div class="qa-hit-src">無線電問答彙刊 ' +
      doc.issue +
      " &middot; scan p. " +
      (p + 1) +
      "</div>" +
      '<div class="qa-hit-txt">' +
      snippet(doc.pages[p].t, lastWords) +
      "</div>";
    box.appendChild(el);
  }
  shown += Math.min(PAGE_SIZE, lastHits.length - shown);
  const more = document.getElementById("qa-more");
  if (shown < lastHits.length) {
    more.style.display = "";
    more.textContent = "Show more (" + shown + " of " + lastHits.length + " shown)";
  } else {
    more.style.display = "none";
  }
}

async function run(q) {
  const box = document.getElementById("qa-results");
  const info = document.getElementById("qa-info");
  box.innerHTML = "";
  shown = 0;
  document.getElementById("qa-more").style.display = "none";
  if (!q.trim()) {
    info.textContent = "";
    return;
  }
  info.textContent = "Searching…";
  await loadNorm();
  await loadCat();
  const hits = await search(q);
  lastHits = [...hits].sort((a, b) => a - b);
  lastWords = q
    .split(/\s+/)
    .filter((w) => !w.startsWith("-"))
    .flatMap((w) => w.split("|"))
    .filter(Boolean);
  /* The hit count is reported in full. Nothing is capped or silently truncated;
     the list below is only rendered in batches. */
  info.innerHTML = lastHits.length ? "<b>" + lastHits.length + "</b> pages match." : "No matches. Try a shorter term, or two characters of it.";
  if (lastHits.length) await renderMore();
  const u = new URL(location);
  u.searchParams.set("q", q);
  history.replaceState(null, "", u);
}

window.addEventListener("DOMContentLoaded", async () => {
  const inp = document.getElementById("qa-q");
  if (!inp) return;
  const go = () => run(inp.value);
  document.getElementById("qa-go").onclick = go;
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
  });
  document.getElementById("qa-more").onclick = renderMore;
  document.querySelectorAll(".qa-eg").forEach((a) => {
    a.onclick = (e) => {
      e.preventDefault();
      inp.value = a.textContent;
      go();
    };
  });
  const q0 = new URL(location).searchParams.get("q");
  if (q0) {
    inp.value = q0;
    go();
  }
  const st = await (await fetch(QA_BASE + "stats.json")).json();
  const el = document.getElementById("qa-scale");
  if (el) {
    el.textContent = st.docs + " issues · " + st.pages + " scanned pages · " + st.chars.toLocaleString() + " characters";
  }
});
