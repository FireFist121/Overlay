const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const searchStr = `<label>Set Time (minutes)</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="number" value={timerInput} onChange={e => setTimerInput(e.target.value)} min={1} max={999} style={{ flex: 1, margin: 0 }} />`;
const replaceStr = `<label>SET TIME</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="text" value={timerInput} onChange={e => setTimerInput(e.target.value)} placeholder="HH:MM:SS" style={{ flex: 1, margin: 0 }} />`;
content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/app/admin/page.tsx', content);
console.log("Updated SET TIME block");