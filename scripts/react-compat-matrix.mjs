import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '..');

const defaultReactMatrix = [
  { label: 'react16', react: '16.14.0', reactDom: '16.14.0' },
  { label: 'react17', react: '17.0.2', reactDom: '17.0.2' },
  { label: 'react18', react: '18.3.1', reactDom: '18.3.1' },
  { label: 'react19', react: '19.2.4', reactDom: '19.2.4' },
];

function getRequestedReactMatrix() {
  const react = process.env.REACT_COMPAT_REACT;
  const reactDom = process.env.REACT_COMPAT_REACT_DOM;
  const label = process.env.REACT_COMPAT_LABEL;

  if (!react && !reactDom) {
    return defaultReactMatrix;
  }

  if (!react || !reactDom) {
    throw new Error('REACT_COMPAT_REACT and REACT_COMPAT_REACT_DOM must be provided together.');
  }

  return [
    {
      label: label ?? `react-${react}`,
      react,
      reactDom,
    },
  ];
}

function runCommand(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
      npm_config_cache: npmCacheDir,
    },
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

const reactMatrix = getRequestedReactMatrix();
const smokeSource = await readFile(path.join(dirname, 'react-compat-smoke.mjs'), 'utf8');
const npmCacheDir = await mkdtemp(path.join(os.tmpdir(), 'react-atom-trigger-npm-cache-'));

runCommand('pnpm', ['build'], repoRoot);
const packDir = await mkdtemp(path.join(os.tmpdir(), 'react-atom-trigger-pack-'));
runCommand('npm', ['pack', '--ignore-scripts', '--pack-destination', packDir], repoRoot);
const [packageTarball] = await readdir(packDir);

if (!packageTarball) {
  throw new Error(`npm pack did not produce an archive in ${packDir}`);
}

const packageTarballPath = path.join(packDir, packageTarball);

try {
  for (const version of reactMatrix) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `react-atom-trigger-${version.label}-`));

    try {
      await writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            private: true,
            type: 'module',
            dependencies: {
              jsdom: '^29.0.1',
              react: version.react,
              'react-dom': version.reactDom,
              'react-atom-trigger': `file:${packageTarballPath}`,
            },
          },
          null,
          2,
        ),
      );
      await writeFile(path.join(tempDir, 'smoke.mjs'), smokeSource);

      runCommand('npm', ['install', '--no-package-lock'], tempDir);
      runCommand('node', ['smoke.mjs'], tempDir, {
        REACT_ATOM_TRIGGER_IMPORT: 'react-atom-trigger',
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
} finally {
  await rm(packDir, { recursive: true, force: true });
  await rm(npmCacheDir, { recursive: true, force: true });
}
