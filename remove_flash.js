const fs = require("fs");
let content = fs.readFileSync("src/app/widget/page.tsx", "utf8");
content = content.replace("<span>⚡ TOP SUPPORTERS</span>", "<span>TOP SUPPORTERS</span>");
fs.writeFileSync("src/app/widget/page.tsx", content, "utf8");
console.log("Removed flash emoji from widget!");