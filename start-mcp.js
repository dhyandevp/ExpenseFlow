const { spawn } = require('child_process');
const server = spawn('npx', ['-y', '@playwright/mcp@latest'], { stdio: ['pipe', 'pipe', 'inherit'] });
