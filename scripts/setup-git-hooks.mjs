import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const hooksPath = '.githooks';

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

try {
  const insideWorkTree = runGit(['rev-parse', '--is-inside-work-tree']);
  if (insideWorkTree !== 'true') {
    process.exit(0);
  }

  if (!existsSync(hooksPath)) {
    process.exit(0);
  }

  runGit(['config', 'core.hooksPath', hooksPath]);
  console.log(`[react-atom-trigger] Git hooks path set to ${hooksPath}`);
} catch {
  process.exit(0);
}
