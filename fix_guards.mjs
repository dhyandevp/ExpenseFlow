import fs from 'fs';
import path from 'path';

const pages = [
  'client/src/pages/Dashboard.jsx',
  'client/src/pages/ExpenseLogger.jsx',
  'client/src/pages/ScenarioPlanner.jsx',
  'client/src/pages/FairnessReport.jsx',
  'client/src/pages/Settings.jsx',
  'client/src/components/SettlementHistory.jsx'
];

for (const p of pages) {
  const fullPath = path.resolve(p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    content = content.replace(/  if \(\!currentGroup\) return null;\n/g, '');
    fs.writeFileSync(fullPath, content);
    console.log("Updated", p);
  }
}
