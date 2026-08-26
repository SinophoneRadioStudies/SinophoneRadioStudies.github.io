/* Contents view: every numbered question in the run, grouped by issue.

   The periodical numbers its questions continuously across the whole run, and
   prints the name and postal address of the reader who sent each one, so this
   list doubles as a table of contents and as a register of who was writing in. */
const QA_BASE = window.QA_BASE || "/assets/qa/";
const QA_READ = window.QA_READ || "/periodicals/radio-qa/read/";

let TOC = null;

const esc = (x) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function groupByIssue(rows) {
  const g = new Map();
  for (const r of rows) {
    if (!g.has(r.d)) g.set(r.d, { issue: r.issue, rows: [] });
    g.get(r.d).rows.push(r);
  }
  return g;
}

function render(filter) {
  const box = document.getElementById("qa-toc");
  const info = document.getElementById("qa-toc-info");
  const f = (filter || "").trim();
  const rows = f ? TOC.filter((r) => r.q.includes(f) || (r.who || "").includes(f)) : TOC;
  box.innerHTML = "";
  info.innerHTML = f
    ? "<b>" + rows.length + "</b> of " + TOC.length + " entries contain “" + esc(f) + "”."
    : "<b>" + TOC.length + "</b> numbered questions across " + groupByIssue(TOC).size + " issues.";
  if (!rows.length) return;

  for (const [id, grp] of groupByIssue(rows)) {
    const det = document.createElement("details");
    det.className = "qa-issue";
    if (f) det.open = true;
    const sum = document.createElement("summary");
    sum.innerHTML =
      '<span class="qa-issue-t">無線電問答彙刊 no. ' +
      grp.issue +
      "</span>" +
      '<span class="qa-issue-n">' +
      grp.rows.length +
      " questions · nos. " +
      grp.rows[0].n +
      "–" +
      grp.rows[grp.rows.length - 1].n +
      "</span>";
    det.appendChild(sum);
    const ul = document.createElement("div");
    ul.className = "qa-toc-list";
    for (const r of grp.rows) {
      const a = document.createElement("a");
      a.className = "qa-toc-row";
      a.href = QA_READ + "?d=" + encodeURIComponent(r.d) + "&p=" + r.p;
      a.innerHTML =
        '<span class="qa-qn">' +
        r.n +
        "</span>" +
        '<span class="qa-qt">' +
        esc(r.q) +
        "</span>" +
        '<span class="qa-who">' +
        esc(r.who || "") +
        "</span>";
      ul.appendChild(a);
    }
    det.appendChild(ul);
    box.appendChild(det);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const box = document.getElementById("qa-toc");
  if (!box) return;
  TOC = await (await fetch(QA_BASE + "toc.json")).json();
  const inp = document.getElementById("qa-filter");
  inp.addEventListener("input", () => render(inp.value));
  const q0 = new URL(location).searchParams.get("f");
  if (q0) inp.value = q0;
  render(inp.value);
});
