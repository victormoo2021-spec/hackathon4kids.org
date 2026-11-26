// Downloads Google latin woff2 and subsets to Basic Latin + ’ “ ” – — • … ×, keeping variable axes.
// Needs: uvx (runs fonttools+brotli on the fly). Usage: node scripts/subset-fonts.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const UNICODES = 'U+0020-007E,U+2019,U+201C,U+201D,U+2013,U+2014,U+2022,U+2026,U+00D7';
const out = 'src/app/fonts';
const fonts = {
  'bricolage-grotesque': 'Bricolage+Grotesque:wght@200..800',
  'bricolage-grotesque-opsz': 'Bricolage+Grotesque:opsz,wght@12..96,200..800',
  archivo: 'Archivo:wdth,wght@62..125,100..900',
  'schibsted-grotesk': 'Schibsted+Grotesk:wght@400..900',
  'jetbrains-mono': 'JetBrains+Mono:wght@500',
  'ibm-plex-mono': 'IBM+Plex+Mono:wght@400',
  'martian-mono': 'Martian+Mono:wght@400',
};
mkdirSync(out, { recursive: true });
for (const [name, q] of Object.entries(fonts)) {
  if (process.argv[2] && process.argv[2] !== name) continue; // optional: node scripts/subset-fonts.mjs archivo
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  const url = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].pop()[1]; // last block = latin
  const src = join(tmpdir(), `${name}-full.woff2`);
  writeFileSync(src, Buffer.from(await (await fetch(url)).arrayBuffer()));
  const dest = `${out}/${name}-subset.woff2`;
  execFileSync('uvx', ['--from', 'fonttools', '--with', 'brotli', 'pyftsubset', src, `--unicodes=${UNICODES}`, '--flavor=woff2', '--layout-features=*', `--output-file=${dest}`], { stdio: 'inherit' });
  console.log(name, statSync(dest).size);
}
