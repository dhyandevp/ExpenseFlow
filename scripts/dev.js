import { spawn } from 'child_process';

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting ExpenseFlow Cloudflare Development Environment...');

const children = [];

function runProcess(name, command, args, color) {
  const proc = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  children.push(proc);

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m exited with code ${code}`);
    cleanup(code || 0);
  });

  proc.on('error', (err) => {
    console.error(`${color}[${name}]\x1b[0m error:`, err);
  });

  return proc;
}

let isCleaningUp = false;
function cleanup(exitCode = 0) {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\x1b[33m%s\x1b[0m', '🛑 Shutting down dev servers...');
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch (e) {}
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

// 1. Start Cloudflare Worker on port 8787
runProcess('worker', 'npx', ['wrangler', 'dev', '--port', '8787'], '\x1b[35m');

// 2. Start Vite Client on port 5173 (proxies /api to 8787)
runProcess('vite', 'npm', ['--prefix', 'client', 'run', 'dev'], '\x1b[34m');
