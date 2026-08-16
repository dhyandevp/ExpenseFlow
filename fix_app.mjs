import fs from 'fs';

let content = fs.readFileSync('client/src/App.jsx', 'utf-8');

// Replace all occurrences of the route ternary pattern
const pattern = /path="\/group\/:code([^"]*)"\s+element=\{\s+currentGroup \? \(\s+<AppLayout>\s+<([a-zA-Z]+) \/>\s+<\/AppLayout>\s+\)\s+:\s+\(\s+<Navigate to="\/" replace \/>\s+\)\s+\}/g;

content = content.replace(pattern, (match, pathSuffix, ComponentName) => {
  return `path="/group/:code${pathSuffix}"
              element={
                <AppLayout>
                  <${ComponentName} />
                </AppLayout>
              }`;
});

fs.writeFileSync('client/src/App.jsx', content);
console.log("Updated App.jsx");
