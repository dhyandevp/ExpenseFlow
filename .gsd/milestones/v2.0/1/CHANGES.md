# Phase 1.2 — Brand Rename Change Manifest

## Summary
Replaced all "BalanceBoard" / "balanceboard" / "balance-board" references with "ExpenseFlow" / "expenseflow" equivalents across the entire codebase.

## Files Modified

| File | Lines Changed | Old Value | New Value |
|------|--------------|-----------|-----------|
| `client/index.html` | L5 | ⚖️ favicon emoji | 💸 favicon emoji |
| `client/index.html` | L11 | `BalanceBoard is a free...` | `ExpenseFlow is a free...` |
| `client/index.html` | L13 | `application-name: BalanceBoard` | `application-name: ExpenseFlow` |
| `client/index.html` | L15 | `balance-board.netlify.app` | `expenseflow.site` |
| `client/index.html` | L19 | `og:url balance-board.netlify.app` | `og:url expenseflow.site` |
| `client/index.html` | L20 | `og:title BalanceBoard —` | `og:title ExpenseFlow —` |
| `client/index.html` | L22 | `og:site_name BalanceBoard` | `og:site_name ExpenseFlow` |
| `client/index.html` | L24 | `og:image balance-board.netlify.app` | `og:image expenseflow.site` |
| `client/index.html` | L30 | `twitter:title BalanceBoard —` | `twitter:title ExpenseFlow —` |
| `client/index.html` | L32 | `twitter:image balance-board.netlify.app` | `twitter:image expenseflow.site` |
| `client/index.html` | L39 | `<title>BalanceBoard —` | `<title>ExpenseFlow —` |
| `client/index.html` | L46 | `"name": "BalanceBoard"` | `"name": "ExpenseFlow"` |
| `client/index.html` | L47 | `"url": "balance-board.netlify.app"` | `"url": "expenseflow.site"` |
| `client/index.html` | L59 | `"name": "BalanceBoard Team"` | `"name": "ExpenseFlow Team"` |
| `client/src/App.jsx` | L22 | `balanceboard_recent_groups` | `expenseflow_recent_groups` |
| `client/src/App.jsx` | L69 | `balanceboard_group` | `expenseflow_group` |
| `client/src/App.jsx` | L97 | `balanceboard_group` (set) | `expenseflow_group` (set) |
| `client/src/App.jsx` | L99 | `balanceboard_group` (remove) | `expenseflow_group` (remove) |
| `client/src/hooks/useDocumentTitle.js` | L5 | `BalanceBoard group` | `ExpenseFlow group` |
| `client/src/hooks/useDocumentTitle.js` | L17 | `— BalanceBoard` | `— ExpenseFlow` |
| `client/src/pages/Landing.jsx` | L43 | `aria-label="BalanceBoard logo"` ⚖️ | `aria-label="ExpenseFlow logo"` 💸 |
| `client/src/pages/Landing.jsx` | L45 | `BalanceBoard` (nav brand) | `ExpenseFlow` |
| `client/src/pages/Landing.jsx` | L74 | `BalanceBoard tracks shared...` | `ExpenseFlow tracks shared...` |
| `client/src/pages/Landing.jsx` | L190 | `Why BalanceBoard?` | `Why ExpenseFlow?` |
| `client/src/pages/Landing.jsx` | L262 | `BalanceBoard handles the math` | `ExpenseFlow handles the math` |
| `client/src/pages/Landing.jsx` | L320 | `BalanceBoard — Fair sharing...` | `ExpenseFlow — Fair sharing...` |
| `client/src/pages/FairnessReport.jsx` | L105 | `BalanceBoard-{name}-Report.pdf` | `ExpenseFlow-{name}-Report.pdf` |
| `client/src/pages/FairnessReport.jsx` | L110 | `BalanceBoard Report -` | `ExpenseFlow Report -` |
| `client/src/pages/FairnessReport.jsx` | L111 | `on BalanceBoard!` | `on ExpenseFlow!` |
| `client/package.json` | L2 | `balanceboard-client` | `expenseflow-client` |
| `server/package.json` | L2 | `balanceboard-server` | `expenseflow-server` |
| `server/db.js` | L7 | `balanceboard.db` | `expenseflow.db` |
| `server/index.js` | L67 | `BalanceBoard API is running` | `ExpenseFlow API is running` |
| `server/index.js` | L92 | `🌿 BalanceBoard API` | `🌿 ExpenseFlow API` |
| `server/routes/reports.js` | L233 | `balanceboard-report.csv` | `expenseflow-report.csv` |
| `package.json` (root) | L2 | `balanceboard` | `expenseflow` |
| `render.yaml` | L1 | `BalanceBoard Backend` | `ExpenseFlow Backend` |
| `render.yaml` | L7 | `balanceboard-api` | `expenseflow-api` |
| `render.yaml` | L20 | `balanceboard.netlify.app` | `expenseflow.netlify.app` |
| `render.yaml` | L24 | `balanceboard-api.onrender.com` | `expenseflow-api.onrender.com` |
| `netlify.toml` | L16 | `balanceboard-api.onrender.com` | `expenseflow-api.onrender.com` |
| `README.md` | L1 | (old content) | `# ExpenseFlow` |

**Total: 42 replacements across 14 files**
