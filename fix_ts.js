const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// Fix 1: Add color to local Donor interface
content = content.replace(
  "interface Donor { name: string; amount: number; }",
  "interface Donor { name: string; amount: number; color?: string; }"
);

// Fix 2: Add isLoggedIn + authChecked states right after "const room = ..."
content = content.replace(
  `  const room = params.get("room") || "default";`,
  `  const room = params.get("room") || "default";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setAuthChecked(true); return; }
    fetch(\`/api/auth?token=\${token}\`)
      .then(r => r.json())
      .then(d => { setIsLoggedIn(!!d.valid); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);`
);

// Fix 3: Remove any duplicate useEffect that was left from old script
// (check if there's a duplicate authChecked useEffect)
const count = (content.match(/setAuthChecked\(true\)/g) || []).length;
if (count > 2) {
  // Remove the duplicate block
  content = content.replace(
    /\n  useEffect\(\(\) => \{\n    const token = localStorage\.getItem\(AUTH_TOKEN_KEY\);\n    if \(!token\) \{ setAuthChecked\(true\); return; \}\n    fetch[\s\S]*?setAuthChecked\(true\);\n  \}, \[\]\);/,
    ""
  );
}

fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log("Fixed TypeScript errors!");