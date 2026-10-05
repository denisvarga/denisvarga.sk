// Served in one nonce'd <style>; the CSP blocks every other stylesheet and all style attributes.
export const STYLES = `
*,*::before,*::after{box-sizing:border-box}
:root{--ink:#131416;--bg:#ececea;--accent:#f2541b;--card:#f7f7f5;--line:rgba(19,20,22,.13);--muted:rgba(19,20,22,.64);color-scheme:light}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
main{max-width:1160px;margin:0 auto;padding:28px 16px 56px}
h1{font-size:1.65rem;line-height:1.2;letter-spacing:-.01em;margin:0}
h2{font-size:1.05rem;margin:0 0 12px}
section{margin-top:32px}
.lead{margin:6px 0 0;color:var(--muted);font-size:.9rem}
.accent{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent);margin-right:10px;vertical-align:middle}
a{color:var(--ink);text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:3px}
a:hover{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.muted{color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.card dt{font-size:.8rem;color:var(--muted)}
.card dd{margin:4px 0 0;font-size:1.35rem;font-weight:650;font-variant-numeric:tabular-nums}
.card small{display:block;font-size:.75rem;font-weight:400;color:var(--muted)}
.outcomes{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:14px 0 0}
.outcomes li{display:flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:3px 12px 3px 4px;font-size:.85rem;font-variant-numeric:tabular-nums}
.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 9px;font-size:.78rem;white-space:nowrap;background:#fff}
.badge.alert{border-color:var(--accent);background:rgba(242,84,27,.12)}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.chart{display:block;width:100%;max-width:760px;height:auto;margin:0 auto}
.filters{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:flex-end}
.filters label{display:grid;gap:4px;font-size:.8rem;color:var(--muted)}
.filters .grow{flex:1 1 260px}
input,select,button{font:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:8px;padding:7px 10px;min-height:40px;width:100%}
button{width:auto;background:var(--ink);color:var(--bg);border-color:var(--ink);padding:7px 18px;cursor:pointer}
button:hover{background:var(--accent);border-color:var(--accent);color:var(--ink)}
.filters a{padding:8px 0}
.meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px;align-items:center;margin:16px 0 10px;font-size:.9rem}
table{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border:1px solid var(--line);border-radius:12px}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:1px solid var(--line)}
th{font-size:.74rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
tbody tr:last-child td{border-bottom:0}
.text{min-width:240px;white-space:pre-wrap;overflow-wrap:anywhere}
.nowrap{white-space:nowrap;font-variant-numeric:tabular-nums}
summary{cursor:pointer;color:var(--muted);white-space:nowrap}
details[open] summary{margin-bottom:6px}
.answer{white-space:pre-wrap;overflow-wrap:anywhere;max-width:62ch}
.empty{padding:28px 16px;text-align:center;color:var(--muted)}
.pager{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px}
@media (max-width:720px){
main{padding-top:20px}
h1{font-size:1.35rem}
thead{display:none}
table,tbody{display:block}
tbody tr{display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:12px 14px;border-bottom:1px solid var(--line)}
tbody tr:last-child{border-bottom:0}
td{border:0;padding:0}
td.time{color:var(--muted);font-size:.85rem}
td.lang,td.latency{text-align:right}
.text,.wide,.empty{grid-column:1/-1;min-width:0}
.chart text{font-size:22px}
}
`;
