/**
 * Self-hosted, pyftsubset'd fonts (Basic Latin + ’ “ ” – — • … ×). Regenerate: node scripts/subset-fonts.mjs
 * Bytes (woff2): bricolage 26,444 (opsz variant 52,616) | archivo 52,344 (wght+wdth axes) | schibsted 30,696
 *                jetbrains-mono 500 16,636 | ibm-plex-mono 400 5,616 | martian-mono 400 5,804
 * Pairs: bricolage+jetbrains 43,080 | archivo+plex 57,960 | schibsted+martian 36,500
 * Usage: import { archivo, ibmPlexMono } from './fonts'; className={`${archivo.variable} ${ibmPlexMono.variable}`}
 */
import localFont from 'next/font/local';

export const bricolage = localFont({ src: './bricolage-grotesque-subset.woff2', weight: '200 800', variable: '--font-display', display: 'swap', preload: true, adjustFontFallback: 'Arial' });
export const bricolageOpsz = localFont({ src: './bricolage-grotesque-opsz-subset.woff2', weight: '200 800', variable: '--font-display', display: 'swap', preload: true, adjustFontFallback: 'Arial' });
export const archivo = localFont({ src: './archivo-subset.woff2', weight: '100 900', declarations: [{ prop: 'font-stretch', value: '62% 125%' }], variable: '--font-archivo', display: 'swap', preload: true, adjustFontFallback: 'Arial' });
export const schibsted = localFont({ src: './schibsted-grotesk-subset.woff2', weight: '400 900', variable: '--font-display', display: 'swap', preload: true, adjustFontFallback: 'Arial' });
export const jetbrainsMono = localFont({ src: './jetbrains-mono-subset.woff2', weight: '500', variable: '--font-mono', display: 'swap', preload: false, adjustFontFallback: 'Arial' });
export const ibmPlexMono = localFont({ src: './ibm-plex-mono-subset.woff2', weight: '400', variable: '--font-plex', display: 'swap', preload: false, adjustFontFallback: 'Arial' });
export const martianMono = localFont({ src: './martian-mono-subset.woff2', weight: '400', variable: '--font-mono', display: 'swap', preload: false, adjustFontFallback: 'Arial' });
