const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const parseFunction = `
function parseTimeInput(input: string): number {
  if (!input) return 0;
  const parts = input.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0] * 60;
  return 0;
}
`;

if (!content.includes('parseTimeInput')) {
  content = content.replace('function fmtAmt(n: number) { return "Rs " + Number(n).toLocaleString("en-IN"); }', 'function fmtAmt(n: number) { return "Rs " + Number(n).toLocaleString("en-IN"); }' + parseFunction);
}

content = content.replace(/const mins = parseInt\(timerInput\) \|\| 10;\s*const secs = localSecsRef\.current > 0 \? localSecsRef\.current : mins \* 60;\s*const total = current\.timer\.total \|\| mins \* 60;/, 'const totalSecs = parseTimeInput(timerInput) || 600;\n    const secs = localSecsRef.current > 0 ? localSecsRef.current : totalSecs;\n    const total = current.timer.total || totalSecs;');

content = content.replace(/const mins = parseInt\(timerInput\) \|\| 10;\s*setLocalRunning\(false\); localRunningRef\.current = false;\s*setLocalSecs\(mins \* 60\); localSecsRef\.current = mins \* 60;\s*if \(tickRef\.current\) clearInterval\(tickRef\.current\);\s*endTimeRef\.current = null;\s*push\(\{ timer: \{ remaining: mins \* 60, running: false, total: mins \* 60 \} \}\);/, 'const totalSecs = parseTimeInput(timerInput) || 600;\n    setLocalRunning(false); localRunningRef.current = false;\n    setLocalSecs(totalSecs); localSecsRef.current = totalSecs;\n    if (tickRef.current) clearInterval(tickRef.current);\n    endTimeRef.current = null;\n    push({ timer: { remaining: totalSecs, running: false, total: totalSecs } });');

content = content.replace(/<label>Set Time \(minutes\)<\/label>\s*<div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>\s*<input type="number" value={timerInput} onChange={e => setTimerInput\(e\.target\.value\)} min={1} max={999} style={{ flex: 1, margin: 0 }} \/>/, '<label>SET TIME</label>\n          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>\n            <input type="text" value={timerInput} onChange={e => setTimerInput(e.target.value)} placeholder="HR:MIN:SEC" style={{ flex: 1, margin: 0 }} />');

content = content.replace(/<label>Quick Presets<\/label>\s*<div className="presets" style={{ marginBottom: "12px" }}>\s*\{\[5,10,15,30,60,90\]\.map\(m => \(\s*<div key=\{m\} className="preset-btn" onClick=\{\(\) => setPreset\(m\)\}>\{m < 60 \? `\$\{m\} min` : `\$\{m\/60\} hr`\}<\/div>\s*\)\)\}\s*<\/div>/, `<label>ADD PRESETS</label>
          <div className="presets" style={{ marginBottom: "12px" }}>
            {[10,20,40,60,120,180].map(m => (
              <div key={m} className="preset-btn" onClick={() => addTime(m)}>{m < 60 ? \`\${m}min\` : \`\${m/60}hr\`}</div>
            ))}
          </div>`);

content = content.replace(/<label>Add \/ Remove Time<\/label>\s*<div className="btn-row">\s*\{\[1,5,10\]\.map\(m => <button key=\{m\} className="btn btn-cyan btn-sm" onClick=\{\(\) => addTime\(m\)\}>\+\{m\}m<\/button>\)\}\s*\{\[1,5\]\.map\(m => <button key=\{m\} className="btn btn-red btn-sm" onClick=\{\(\) => addTime\(-m\)\}>-\{m\}m<\/button>\)\}\s*<\/div>/, `<label>REMOVE TIME</label>
          <div className="btn-row">
            {[-10,-20,-30,-60].map(m => <button key={m} className="btn btn-red btn-sm" onClick={() => addTime(m)}>{m === -60 ? '-1hr' : \`\${m}min\`}</button>)}
          </div>`);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Done rewriting page.tsx');