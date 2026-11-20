// Leonida Platinum — entrypoint for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The entry is the static guide in app/ plus the screenshots/ renders of it.
// This program stages both into the grader's output directory and writes the
// dossier.json summary the judge reads, using the vendored make.fun library.
//
// The output directory is a mount inside the grader, so it is never removed
// itself: only its previous contents are cleared, one child at a time, before
// the fresh app/ and screenshots/ are copied in. Locally, MAKEFUN_OUTPUT_DIR
// stands in for /output, e.g. MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to stage a broken entry: the guide's front door must exist.
if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('main.ts: app/index.html is missing — nothing to stage');
}

// Make sure the destination exists, then empty it without touching the
// directory itself — removing a mount point throws EBUSY in the grader.
mkdirSync(outDir, { recursive: true });
for (const child of readdirSync(outDir)) {
  rmSync(join(outDir, child), { recursive: true, force: true });
}

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
const shotCount = existsSync(join(repoRoot, 'screenshots'))
  ? readdirSync(join(repoRoot, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f)).length
  : 0;
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: text budget shapes the dossier bytes; the rest refuse an
// entry the scorer would refuse (more than 4 screenshots, one over 256 KiB,
// more than 993 entries or 48 MiB of app files).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('staged app/ + ' + shotCount + ' screenshot(s); wrote ' + join(outDir, 'dossier.json') + ' (' + dossier.length + ' bytes)');
