const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');
if (!css.includes('preset-btn-red')) {
  css = css.replace('.preset-btn:hover { background:rgba(0,210,255,.15); color:var(--cyan); border-color:rgba(0,210,255,.4); }', '.preset-btn:hover { background:rgba(0,210,255,.15); color:var(--cyan); border-color:rgba(0,210,255,.4); }\n.preset-btn-red { padding:6px 12px; background:rgba(255,50,50,.06); border:1px solid rgba(255,50,50,.2); border-radius:8px; color:var(--muted); font-family:var(--font-rajdhani),sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; letter-spacing:1px; }\n.preset-btn-red:hover { background:rgba(255,50,50,.15); color:#ff4444; border-color:rgba(255,50,50,.4); }');
  fs.writeFileSync('src/app/globals.css', css);
}

let tsx = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const search = `<label>REMOVE TIME</label>
          <div className="btn-row">
            {[-10,-20,-30,-60].map(m => <button key={m} className="btn btn-red btn-sm" onClick={() => addTime(m)}>{m === -60 ? '-1hr' : \`\${m}min\`}</button>)}
          </div>`;
const replace = `<label>REMOVE TIME</label>
          <div className="presets" style={{ marginBottom: "12px" }}>
            {[-10,-20,-30,-60].map(m => (
              <div key={m} className="preset-btn-red" onClick={() => addTime(m)}>{m === -60 ? '-1hr' : \`\${m}min\`}</div>
            ))}
          </div>`;
tsx = tsx.replace(search, replace);
fs.writeFileSync('src/app/admin/page.tsx', tsx);
console.log("Updated REMOVE TIME buttons to use preset layout");