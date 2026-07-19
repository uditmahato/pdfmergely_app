// PDFMergely brand palette, converted from the web app's tailwind.config.ts
// HSL tokens so the mobile app reads as the same product. Keep in sync with
// the web repo when the theme changes.

export const palette = {
  bg: 'hsl(222, 47%, 5%)',
  surface: 'hsl(222, 40%, 8%)',
  surface2: 'hsl(222, 36%, 11%)',
  border: 'hsl(222, 30%, 18%)',
  muted: 'hsl(222, 15%, 60%)',
  foreground: 'hsl(210, 40%, 96%)',
  brand: 'hsl(160, 84%, 42%)',
  brandFg: 'hsl(160, 90%, 12%)',
  brandSoft: 'hsl(160, 60%, 16%)',
  // Dark enough that white text passes WCAG AA (mirrors brand.strong on web).
  brandStrong: 'hsl(160, 84%, 27%)',
  danger: '#f87171',
} as const;
