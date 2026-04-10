/**
 * Build a single .jsx artifact file from the design notebook source.
 *
 * Usage: node build-artifact.js
 *
 * Bundles NotebookApp, iterations, and all imports into a self-contained .jsx
 * file that works inside Claude's artifact renderer (no dev server needed).
 *
 * Key constraints the artifact renderer imposes:
 *   - Single .jsx file with `export default` component
 *   - React is provided by the host — no react/react-dom imports in bundle
 *   - No external CSS files — must inject styles at runtime
 *   - No `react/jsx-runtime` — must use classic JSX transform
 */

import { execSync } from 'node:child_process'
import { mkdirSync, cpSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUILD_DIR = join(__dirname, '.artifact-build')
const OUTPUT_FILE = join(__dirname, 'design-notebook.jsx')

// ── Step 1: Copy src/ to temp build dir ──

if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true })
mkdirSync(BUILD_DIR, { recursive: true })
cpSync(join(__dirname, 'src'), BUILD_DIR, { recursive: true })

// ── Step 2: Write a tsconfig that forces classic JSX transform ──

writeFileSync(join(BUILD_DIR, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react',
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false,
  },
}, null, 2))

// ── Step 3: Write a shim entry point that pulls in NotebookApp + iterations ──

const shimPath = join(BUILD_DIR, '_entry.ts')
writeFileSync(shimPath, [
  `import NotebookApp from './NotebookApp'`,
  `import { ITERATIONS, PROJECT } from './iterations'`,
  `export { NotebookApp, ITERATIONS, PROJECT }`,
].join('\n'))

// ── Step 4: Bundle with esbuild ──

function findEsbuild() {
  try {
    const bin = execSync('find /home -name esbuild -type f -path "*/bin/esbuild" 2>/dev/null | head -1', { encoding: 'utf-8', timeout: 5000 }).trim()
    if (bin) return bin
  } catch {}
  return 'npx esbuild'
}

const esbuildCmd = [
  findEsbuild(),
  shimPath,
  '--bundle',
  '--format=esm',
  '--jsx=transform',
  '--jsx-factory=React.createElement',
  '--jsx-fragment=React.Fragment',
  `--tsconfig=${join(BUILD_DIR, 'tsconfig.json')}`,
  '--external:react',
  '--external:react-dom',
  '--loader:.css=empty',
  `--outfile=${join(BUILD_DIR, 'bundle.js')}`,
].join(' ')

console.log('Bundling with esbuild...')
execSync(esbuildCmd, { stdio: 'inherit' })

// ── Step 5: Read bundle, strip react imports & shim exports ──

let bundle = readFileSync(join(BUILD_DIR, 'bundle.js'), 'utf-8')

// Remove any remaining react import lines (esbuild externalizes but may leave import stubs)
bundle = bundle
  .replace(/^import\s+.*\s+from\s+["']react["'];?\s*$/gm, '')
  .replace(/^import\s+.*\s+from\s+["']react-dom["'];?\s*$/gm, '')
  .replace(/^import\s+.*\s+from\s+["']react\/jsx-runtime["'];?\s*$/gm, '')

// Fix esbuild's deconfliction aliases: when externals are stripped, references
// like useState2, useEffect2 etc. are left dangling. Rewrite them back to the
// originals which are provided by the wrapper's React import.
const reactHooks = [
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle',
  'useDebugValue', 'useDeferredValue', 'useTransition', 'useId',
  'useSyncExternalStore', 'useInsertionEffect',
  'createElement', 'createContext', 'createRef',
  'forwardRef', 'memo', 'lazy', 'Suspense', 'Fragment',
  'Children', 'cloneElement', 'isValidElement',
]
for (const name of reactHooks) {
  // Match numbered aliases like useState2, useEffect3 (word boundary to avoid partial matches)
  const re = new RegExp(`\\b${name}(\\d+)\\b`, 'g')
  bundle = bundle.replace(re, name)
}

// Strip export lines emitted by esbuild from the shim so the only
// export default in the final file is the artifact wrapper's.
bundle = bundle.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')

// ── Step 6: Read notebook.css ──

const css = readFileSync(join(__dirname, 'src', 'notebook.css'), 'utf-8')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$')

// ── Step 7: Assemble the artifact wrapper ──

const artifact = `\
import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';

// ── Injected CSS ──
const NOTEBOOK_CSS = \`${css}\`;

function useStyles() {
  useEffect(() => {
    const id = 'design-notebook-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = NOTEBOOK_CSS;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);
}

function useFonts() {
  useEffect(() => {
    const id = 'design-notebook-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(link);

    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = '';
    document.head.appendChild(preconnect2);
  }, []);
}

// ── Bundled notebook code ──
${bundle}

// ── Artifact entry point ──
export default function DesignNotebookArtifact() {
  useStyles();
  useFonts();
  return React.createElement(NotebookApp, { iterations: ITERATIONS, project: PROJECT });
}
`

// ── Step 8: Write output ──

writeFileSync(OUTPUT_FILE, artifact, 'utf-8')
console.log(`✓ Artifact written to design-notebook.jsx`)

// ── Step 9: Clean up ──

rmSync(BUILD_DIR, { recursive: true })
console.log('✓ Build directory cleaned up')
