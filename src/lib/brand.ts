// PDFMergely design tokens. Palette converted from the web app's tailwind
// HSL tokens; type + radius + depth added for the mobile design language.
// Keep the hues in sync with the web repo when the theme changes.

export const palette = {
  bg: 'hsl(222, 47%, 5%)',
  surface: 'hsl(222, 40%, 8%)',
  surface2: 'hsl(222, 36%, 11%)',
  /** Elevated card face — one step lighter than surface2. */
  surface3: 'hsl(222, 32%, 14%)',
  border: 'hsl(222, 30%, 18%)',
  /** Hairlines inside cards; quieter than `border`. */
  borderSoft: 'hsl(222, 26%, 14%)',
  muted: 'hsl(222, 15%, 60%)',
  foreground: 'hsl(210, 40%, 96%)',
  brand: 'hsl(160, 84%, 42%)',
  brandFg: 'hsl(160, 90%, 12%)',
  brandSoft: 'hsl(160, 60%, 16%)',
  // Dark enough that white text passes WCAG AA (mirrors brand.strong on web).
  brandStrong: 'hsl(160, 84%, 27%)',
  danger: '#f87171',
} as const;

/** Primary-CTA gradient: brand green flowing into teal. */
export const brandGradient = ['hsl(160, 84%, 30%)', 'hsl(172, 70%, 26%)'] as const;

/** Soft brand glow for elevated green elements (FABs, success card). */
export const brandGlow = {
  shadowColor: 'hsl(160, 84%, 42%)',
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
} as const;

/** Type scale. Space Grotesk carries the brand voice (wordmark, headers,
 * numbers); Inter carries everything readable. With custom families,
 * weight lives in the family name — never set fontWeight alongside. */
export const type = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  bold: 'Inter_700Bold',
  semibold: 'Inter_600SemiBold',
  medium: 'Inter_500Medium',
  regular: 'Inter_400Regular',
} as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 } as const;
