// Single source of truth for tool identity: the SAME name, icon, and tint are
// used on the home card, the incoming-file chooser row, and the screen header,
// so the three can never drift apart. Sentence case, verb-first everywhere.

import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export interface ToolDef {
  slug: string;
  /** The one name shown everywhere: card title, chooser row, screen header. */
  name: string;
  tagline: string;
  icon: IconName;
  tint: string;
  /** Takes several PDFs at once (chooser offers it for multi-file shares). */
  multi?: boolean;
}

export const TOOLS: ToolDef[] = [
  { slug: 'merge', name: 'Merge PDFs', tagline: 'Combine PDFs into one', icon: 'git-merge', tint: '#34d399', multi: true },
  { slug: 'split', name: 'Split PDF', tagline: 'Ranges into new files', icon: 'cut', tint: '#38bdf8' },
  { slug: 'organize', name: 'Organize PDF', tagline: 'Reorder, rotate, delete', icon: 'swap-vertical', tint: '#a78bfa' },
  { slug: 'watermark', name: 'Watermark PDF', tagline: 'Stamp every page', icon: 'water', tint: '#22d3ee' },
  { slug: 'page-numbers', name: 'Page numbers', tagline: 'Number your pages', icon: 'list', tint: '#fbbf24' },
  { slug: 'protect', name: 'Protect PDF', tagline: 'Add a password', icon: 'lock-closed', tint: '#f472b6' },
  { slug: 'unlock', name: 'Unlock PDF', tagline: 'Remove a password', icon: 'lock-open', tint: '#4ade80' },
  { slug: 'metadata', name: 'Remove metadata', tagline: 'Strip hidden data', icon: 'eye-off', tint: '#fb923c' },
  { slug: 'bates', name: 'Bates numbers', tagline: 'Stamp legal exhibit IDs', icon: 'pricetag', tint: '#c084fc' },
  { slug: 'resize', name: 'Resize PDF', tagline: 'A4, Letter or Legal', icon: 'resize', tint: '#60a5fa' },
  { slug: 'nup', name: 'N-up PDF', tagline: 'Many pages per sheet', icon: 'grid', tint: '#2dd4bf' },
  { slug: 'flatten', name: 'Flatten PDF', tagline: 'Lock form fields', icon: 'layers', tint: '#f59e0b' },
  { slug: 'signature', name: 'Remove signatures', tagline: 'Strip digital signatures', icon: 'shield-half', tint: '#f87171' },
];

/** Tools that operate on one document — what the chooser offers for a single shared file. */
export const SINGLE_TOOLS: ToolDef[] = TOOLS.filter((t) => !t.multi);

export const MERGE_TOOL: ToolDef = TOOLS.find((t) => t.slug === 'merge')!;

export function toolName(slug: string): string {
  return TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}
