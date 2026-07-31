import { spawn } from 'node:child_process';

const server = spawn('npx', ['tsx', 'src/server/index.ts'], { stdio: 'inherit', shell: true });
const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  server.kill();
  vite.kill();
  process.exit();
});
