# PDFMergely mobile

React Native (Expo) app for [pdfmergely.com](https://pdfmergely.com): privacy-first PDF tools
that run entirely on the device. Same rule as the website: **files never leave the device**.
No upload endpoint, no analytics on file contents, no server in the processing path.

## Architecture

- **Engine**: `src/core/` is vendored from the web repo (`../pdfmergely/src/core/`).
  These are the exact pure-JS (pdf-lib) engine files the website ships; they run on Hermes
  because they use no canvas, WASM, Workers or DOM APIs. Sync with
  `npm run sync-engine` (or `-- --check` in CI to fail on drift).
- **UI**: expo-router screens in `src/app/`, one screen per tool, styled to match the
  web app's dark brand palette (`src/lib/brand.ts`).
- **Files**: `src/lib/files.ts` wraps expo-document-picker (into app cache),
  expo-file-system (bytes in/out) and expo-sharing (share sheet for results).

## Tool roadmap

| Phase | Tools | Why this grouping |
| --- | --- | --- |
| 1 (now) | Merge | Proves the vendored engine end-to-end |
| 2 | Split, Rotate, Organize, Delete/Extract pages, Watermark, Page numbers, Protect, Unlock, Metadata | Pure pdf-lib, no new native code |
| 3 | Page thumbnails/previews | Needs a native PDF renderer (PdfRenderer / PDFKit) |
| 4 | Compress-to-size, OCR, Scan | Need native rasterization / ML Kit; WASM is unavailable on Hermes |

## Development

```bash
npm install
npm run typecheck     # tsc
npm run smoke         # engine smoke test in plain Node (no browser APIs)
npm run android       # build + run on emulator/device
```

Windows note: Android only; iOS builds need a Mac (the code itself is cross-platform).
