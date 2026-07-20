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
  section: SectionTitle;
  /** Takes several PDFs at once (chooser offers it for multi-file shares). */
  multi?: boolean;
}

// Color RULE: one hue per category, every tool wears its category's hue.
// Color encodes what KIND of tool this is (green organizes documents, amber
// stamps them, blue reshapes pages, red touches security) instead of being
// 13 arbitrary decorations. Section order = expected frequency of use.
export const SECTIONS = [
  { title: 'Organize', tint: '#34d399' },
  { title: 'Stamp & number', tint: '#fbbf24' },
  { title: 'Page layout', tint: '#60a5fa' },
  { title: 'Privacy & security', tint: '#f87171' },
] as const;

export type SectionTitle = (typeof SECTIONS)[number]['title'];

export function sectionTint(section: SectionTitle): string {
  return SECTIONS.find((s) => s.title === section)!.tint;
}

export const TOOLS: ToolDef[] = [
  { slug: 'merge', name: 'Merge PDFs', label: 'Merge', tagline: 'Combine PDFs into one', icon: 'git-merge', section: 'Organize', multi: true },
  { slug: 'split', name: 'Split PDF', label: 'Split', tagline: 'Ranges into new files', icon: 'cut', section: 'Organize' },
  { slug: 'organize', name: 'Organize PDF', label: 'Organize', tagline: 'Reorder, rotate, delete', icon: 'swap-vertical', section: 'Organize' },
  { slug: 'watermark', name: 'Watermark PDF', label: 'Watermark', tagline: 'Stamp every page', icon: 'water', section: 'Stamp & number' },
  { slug: 'page-numbers', name: 'Page numbers', label: 'Page numbers', tagline: 'Number your pages', icon: 'list', section: 'Stamp & number' },
  { slug: 'bates', name: 'Bates numbers', label: 'Bates numbers', tagline: 'Stamp legal exhibit IDs', icon: 'pricetag', section: 'Stamp & number' },
  { slug: 'resize', name: 'Resize PDF', label: 'Resize', tagline: 'A4, Letter or Legal', icon: 'resize', section: 'Page layout' },
  { slug: 'nup', name: 'N-up PDF', label: 'N-up', tagline: 'Many pages per sheet', icon: 'grid', section: 'Page layout' },
  { slug: 'flatten', name: 'Flatten PDF', label: 'Flatten', tagline: 'Lock form fields', icon: 'layers', section: 'Page layout' },
  { slug: 'protect', name: 'Protect PDF', label: 'Protect', tagline: 'Add a password', icon: 'lock-closed', section: 'Privacy & security' },
  { slug: 'unlock', name: 'Unlock PDF', label: 'Unlock', tagline: 'Remove a password', icon: 'lock-open', section: 'Privacy & security' },
  { slug: 'metadata', name: 'Remove metadata', label: 'Remove metadata', tagline: 'Strip hidden data', icon: 'eye-off', section: 'Privacy & security' },
  { slug: 'signature', name: 'Remove signatures', label: 'Remove signatures', tagline: 'Strip digital signatures', icon: 'ribbon', section: 'Privacy & security' },
];

/** Tools that operate on one document — what the chooser offers for a single shared file. */
export const SINGLE_TOOLS: ToolDef[] = TOOLS.filter((t) => !t.multi);

export const MERGE_TOOL: ToolDef = TOOLS.find((t) => t.slug === 'merge')!;

export function toolName(slug: string): string {
  return TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}
