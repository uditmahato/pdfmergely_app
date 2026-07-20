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
npm run android       # build + run on emulator/device (local, free)
```

Windows note: Android only; iOS builds need a Mac (the code itself is cross-platform).

## Build policy: local only, no EAS

All builds are done locally with Android Studio's SDK, which is free and unlimited.
This project deliberately does NOT use EAS Build / EAS Submit / EAS Update (Expo's
paid cloud services). Do not add an `eas.json` or run `eas` commands.

Prerequisites (one-time, all free): Android Studio with an SDK + emulator, and these
user environment variables:

- `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
- `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr` (Studio's bundled JDK)
- `%ANDROID_HOME%\platform-tools` on `Path` (for adb)

Release build for the Play Store (also local and free):

```bash
npx expo prebuild --platform android   # generates the android/ project (once)
# one-time: create an upload keystore, then configure android/app signing
keytool -genkeypair -v -keystore upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
cd android && .\gradlew bundleRelease  # -> android/app/build/outputs/bundle/release/app-release.aab
```

Upload the `.aab` in the Play Console by hand. The only money in the whole pipeline is
Google's one-time $25 developer registration.
