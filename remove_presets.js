const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// Remove the ADD PRESETS section entirely and rename "Add Custom Time" label to "Add Time"
content = content.replace(
  `          <label>ADD PRESETS</label>
          <div className="presets" style={{ marginBottom: "12px" }}>
            {[10,20,40,60,120,180].map(m => (
              <div key={m} className="preset-btn" onClick={() => addTime(m)}>{m < 60 ? \`\${m}min\` : \`\${m/60}hr\`}</div>
            ))}
          </div>

          <label>Add Custom Time (minutes)</label>`,
  `          <label>Add Time (minutes)</label>`
);

fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log("Done! Removed presets, kept only Add Time input.");