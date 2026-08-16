const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.scripts['dev:all']) {
    packageJson.scripts['dev:all'] = 'cd client && bun run dev & cd server && bun run dev';
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}
