const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");
content = content.replace(
  "{[10,20,30,60].map(m => (\n              <div key={m} className=\"preset-btn\" onClick={() => addTime(m)}>{m < 60 ? `+${m}min` : `+${m/60}hr`}</div>\n            ))}",
  "{[10,20,30,60,120,180,240].map(m => (\n              <div key={m} className=\"preset-btn\" onClick={() => addTime(m)}>{m < 60 ? `+${m}min` : `+${m/60}hr`}</div>\n            ))}"
);
fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log("Added 2hr, 3hr, 4hr presets!");