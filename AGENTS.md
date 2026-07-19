# PDFMergely mobile — agent instructions

Expo SDK 57 / React Native 0.86. Consult https://docs.expo.dev/versions/v57.0.0/ for exact
APIs — Expo changes fast and pre-SDK-52 knowledge is stale (notably expo-file-system's
class-based File/Directory/Paths API).

## Hard rules

- **Privacy is the product**: no network call may ever carry file data. No upload endpoints,
  no remote conversion APIs, no "cloud OCR" fallbacks. If a capability can't run on-device,
  it stays out of the app.
- **Engine files are vendored, not owned**: `src/core/engine/*` and `src/core/validation/*`
  come verbatim from `../pdfmergely/src/core/`. Fix engine bugs in the WEB repo first, then
  `npm run sync-engine`. Never edit vendored files here (sync will clobber them).
  `src/core/types.ts` is the one app-owned file in that tree (a minimal subset of the web
  repo's types; keep names/shapes identical).
- Only vendor engines that run on Hermes: pure pdf-lib, no canvas/WASM/Worker/DOM APIs.
- `react-native-get-random-values` must stay the FIRST import in `src/app/_layout.tsx`
  (pdf-lib's encryption needs crypto.getRandomValues).

## Verify before pushing

```bash
npm run typecheck
npm run smoke                      # engine runs in plain Node
node scripts/sync-engine.mjs --check
```
