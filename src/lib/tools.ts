// Single source of truth for tool identity: the SAME entry drives the home
// tile, the incoming-file chooser row, and the screen header, so they can
// never drift apart. `label` is the short launcher-tile text (its section
// header supplies the verb context); `name` is the full header/chooser name.

import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export interface ToolDef {
  slug: string;
  /** Full name: screen header and chooser row. */
  name: string;
  /** Short launcher-tile label shown under the icon on Home. */
  label: string;
  tagline: string;
  icon: IconName;
  tint: string;
  section: string;
  /** Takes several PDFs at once (chooser offers it for multi-file shares). */
  multi?: boolean;
}

export const SECTION_ORDER = [
  'Organize',
  'Stamp & number',
  'Page layout',
  'Privacy & security',
] as const;

export const TOOLS: ToolDef[] = [
  { slug: 'merge', name: 'Merge PDFs', label: 'Merge', tagline: 'Combine PDFs into one', icon: 'git-merge', tint: '#34d399', section: 'Organize', multi: true },
  { slug: 'split', name: 'Split PDF', label: 'Split', tagline: 'Ranges into new files', icon: 'cut', tint: '#38bdf8', section: 'Organize' },
  { slug: 'organize', name: 'Organize PDF', label: 'Organize', tagline: 'Reorder, rotate, delete', icon: 'swap-vertical', tint: '#a78bfa', section: 'Organize' },
  { slug: 'watermark', name: 'Watermark PDF', label: 'Watermark', tagline: 'Stamp every page', icon: 'water', tint: '#22d3ee', section: 'Stamp & number' },
  { slug: 'page-numbers', name: 'Page numbers', label: 'Page numbers', tagline: 'Number your pages', icon: 'list', tint: '#fbbf24', section: 'Stamp & number' },
  { slug: 'bates', name: 'Bates numbers', label: 'Bates numbers', tagline: 'Stamp legal exhibit IDs', icon: 'pricetag', tint: '#c084fc', section: 'Stamp & number' },
  { slug: 'resize', name: 'Resize PDF', label: 'Resize', tagline: 'A4, Letter or Legal', icon: 'resize', tint: '#60a5fa', section: 'Page layout' },
  { slug: 'nup', name: 'N-up PDF', label: 'N-up', tagline: 'Many pages per sheet', icon: 'grid', tint: '#2dd4bf', section: 'Page layout' },
  { slug: 'flatten', name: 'Flatten PDF', label: 'Flatten', tagline: 'Lock form fields', icon: 'layers', tint: '#f59e0b', section: 'Page layout' },
  { slug: 'protect', name: 'Protect PDF', label: 'Protect', tagline: 'Add a password', icon: 'lock-closed', tint: '#f472b6', section: 'Privacy & security' },
  { slug: 'unlock', name: 'Unlock PDF', label: 'Unlock', tagline: 'Remove a password', icon: 'lock-open', tint: '#4ade80', section: 'Privacy & security' },
  { slug: 'metadata', name: 'Remove metadata', label: 'Remove metadata', tagline: 'Strip hidden data', icon: 'eye-off', tint: '#fb923c', section: 'Privacy & security' },
  { slug: 'signature', name: 'Remove signatures', label: 'Remove signatures', tagline: 'Strip digital signatures', icon: 'shield-half', tint: '#f87171', section: 'Privacy & security' },
];

/** Tools that operate on one document — what the chooser offers for a single shared file. */
export const SINGLE_TOOLS: ToolDef[] = TOOLS.filter((t) => !t.multi);

export const MERGE_TOOL: ToolDef = TOOLS.find((t) => t.slug === 'merge')!;

export function toolName(slug: string): string {
  return TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}
