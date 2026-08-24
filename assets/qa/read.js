/* Page-by-page reader for the transcribed run of 無線電問答彙刊.
   Text only: the scans themselves are not reproduced here, so that readers go to
   the collection as its digitisers released it. */
/* Base paths are injected by the page so the site keeps working under a
   non-empty baseurl (a fork served from a project page, for instance). */
const QA_BASE = window.QA_BASE || "/assets/qa/";
const QA_READ = window.QA_READ || "/periodicals/radio-qa/read/";
const P = new URL(location).searchParams;
let docId = P.get("d");
let page = parseInt(P.get("p") || "0", 10);
let doc = null;

async function load() {
  const cat = await (await fetch(QA_BASE + "catalog.json")).json();
  if (!docId || !cat.some((c) => c.id === docId)) docId = cat[0].id;
  doc = await (await fetch(QA_BASE + "doc/" + docId + ".json")).json();

  const sel = document.getElementById("qa-jump");
  sel.innerHTML = "";
  for (const c of cat) {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = "無線電問答彙刊 " + c.issue + " (" + c.n + " pp.)";
    if (c.id === docId) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = () => {
    location.href = QA_READ + "?d=" + encodeURIComponent(sel.value) + "&p=0";
  };
  render();
}

function render() {
  page = Math.max(0, Math.min(page, doc.pages.length - 1));
  document.getElementById("qa-text").textContent = doc.pages[page].t;
  document.getElementById("qa-pos").textContent = doc.issue + " · scan p. " + (page + 1) + " of " + doc.pages.length;
  const u = new URL(location);
  u.searchParams.set("d", doc.id);
  u.searchParams.set("p", page);
  history.replaceState(null, "", u);
  window.scrollTo({ top: 0 });
}

window.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("qa-text")) return;
  document.getElementById("qa-prev").onclick = () => {
    page--;
    render();
  };
  document.getElementById("qa-next").onclick = () => {
    page++;
    render();
  };
  document.addEventListener("keydown", (e) => {
    if (!doc) return;
    if (e.key === "ArrowLeft") {
      page--;
      render();
    }
    if (e.key === "ArrowRight") {
      page++;
      render();
    }
  });
  load();
});
