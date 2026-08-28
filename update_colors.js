const fs = require("fs");

// 1. UPDATE DB.TS
let dbTs = fs.readFileSync("src/lib/db.ts", "utf8");
dbTs = dbTs.replace("export interface Donor { name: string; amount: number; }", "export interface Donor { name: string; amount: number; color?: string; }");
fs.writeFileSync("src/lib/db.ts", dbTs);

// 2. UPDATE GLOBALS.CSS
let css = fs.readFileSync("src/app/globals.css", "utf8");
css = css.replace(
  ".list-header-title { font-family:var(--font-rajdhani),sans-serif; font-weight:700; font-size:13px; letter-spacing:4px; color:var(--cyan); text-transform:uppercase; text-shadow:0 0 8px var(--cyan); }",
  ".list-header-title { font-family:var(--font-rajdhani),sans-serif; font-weight:700; font-size:13px; letter-spacing:4px; color:var(--cyan); text-transform:uppercase; text-shadow:0 0 8px var(--cyan); text-align:center; display:block; line-height: 1.4; }"
);
css = css.replace(
  ".donor-card { background:var(--navy2); border:1px solid rgba(0,210,255,.2); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:12px; position:relative; overflow:hidden; animation:slideIn .5s ease both; }",
  ".donor-card { --card-color: var(--cyan); --card-border: rgba(0,210,255,.2); background:var(--navy2); border:1px solid var(--card-border); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:12px; position:relative; overflow:hidden; animation:slideIn .5s ease both; }"
);
css = css.replace(
  ".donor-card::before { content:\"\"; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--cyan); box-shadow:0 0 10px var(--cyan); }",
  ".donor-card::before { content:\"\"; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--card-color); box-shadow:0 0 10px var(--card-color); }"
);
css = css.replace(
  ".donor-card[data-rank=\"1\"] { border-color:rgba(255,215,0,.4); background:linear-gradient(135deg,#1f1a00 0%,var(--navy2) 80%); }",
  ".donor-card[data-rank=\"1\"] { --card-color: var(--gold); --card-border: rgba(255,215,0,.4); background:linear-gradient(135deg,#1f1a00 0%,var(--navy2) 80%); }"
);
css = css.replace(
  ".donor-card[data-rank=\"1\"]::before { background:var(--gold); box-shadow:0 0 10px var(--gold); }",
  ""
);
css = css.replace(
  ".donor-rank { font-family:var(--font-orbitron),monospace; font-size:15px; font-weight:900; color:var(--cyan); text-shadow:0 0 10px var(--cyan); width:24px; text-align:center; flex-shrink:0; }",
  ".donor-rank { font-family:var(--font-orbitron),monospace; font-size:15px; font-weight:900; color:var(--card-color); text-shadow:0 0 10px var(--card-color); width:24px; text-align:center; flex-shrink:0; }"
);
css = css.replace(
  ".donor-card[data-rank=\"1\"] .donor-rank { color:var(--gold); text-shadow:0 0 10px var(--gold); }",
  ""
);
fs.writeFileSync("src/app/globals.css", css);

// 3. UPDATE WIDGET/PAGE.TSX
let widgetTsx = fs.readFileSync("src/app/widget/page.tsx", "utf8");
widgetTsx = widgetTsx.replace(
  /<div key=\{d\.name\} className="donor-card" data-rank=\{i\+1\}>/,
  `<div key={d.name} className="donor-card" data-rank={i+1} style={d.color && d.color !== "#00d2ff" ? { "--card-color": d.color, "--card-border": d.color } as any : undefined}>`
);
fs.writeFileSync("src/app/widget/page.tsx", widgetTsx);

// 4. UPDATE ADMIN/PAGE.TSX
let adminTsx = fs.readFileSync("src/app/admin/page.tsx", "utf8");
adminTsx = adminTsx.replace(
  /const \[donorName, setDonorName\] = useState\(""\);\s*const \[donorAmount, setDonorAmount\] = useState\(""\);/,
  `const [donorName, setDonorName] = useState("");\n  const [donorAmount, setDonorAmount] = useState("");\n  const [donorColor, setDonorColor] = useState("#00d2ff");`
);
adminTsx = adminTsx.replace(
  /if \(idx >= 0\) existing\[idx\] = \{ name: existing\[idx\]\.name, amount: numAmt \};\s*else existing\.push\(\{ name: donorName\.trim\(\), amount: numAmt \}\);/,
  `if (idx >= 0) existing[idx] = { name: existing[idx].name, amount: numAmt, color: donorColor };\n    else existing.push({ name: donorName.trim(), amount: numAmt, color: donorColor });`
);
adminTsx = adminTsx.replace(
  /<label>Amount \(Rs\) - optional<\/label>\s*<input id="amt-input" type="number" value=\{donorAmount\} onChange=\{e => setDonorAmount\(e\.target\.value\)\}\s*placeholder="Leave 0 or blank to hide" min=\{0\} onKeyDown=\{e => e\.key === "Enter" && addDonor\(\)\} \/>/,
  `<div style={{ display: "flex", gap: "8px" }}>\n            <div style={{ flex: 1 }}>\n              <label>Amount (Rs) - optional</label>\n              <input id="amt-input" type="number" value={donorAmount} onChange={e => setDonorAmount(e.target.value)} placeholder="Leave 0 or blank to hide" min={0} onKeyDown={e => e.key === "Enter" && addDonor()} />\n            </div>\n            <div style={{ width: "80px" }}>\n              <label>Color</label>\n              <input type="color" value={donorColor} onChange={e => setDonorColor(e.target.value)} style={{ width: "100%", height: "42px", padding: "0", cursor: "pointer", border: "none", background: "none" }} />\n            </div>\n          </div>`
);
adminTsx = adminTsx.replace(
  /<div className="dai-name">\{d\.name\}<\/div>\s*<div className="dai-amt">\{d\.amount > 0 \? fmtAmt\(d\.amount\) : "-"\}<\/div>/,
  `<div className="dai-name" style={{ color: d.color || "#00d2ff" }}>{d.name}</div>\n                    <div className="dai-amt">{d.amount > 0 ? fmtAmt(d.amount) : "-"}</div>`
);
fs.writeFileSync("src/app/admin/page.tsx", adminTsx);

console.log("Applied alignment and custom color feature!");