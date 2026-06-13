# Releasing Lifter Protocol v1.0.0

Version is set in [app.json](app.json) (`expo.version` = `1.0.0`, iOS `buildNumber` = `1`,
Android `versionCode` = `1`) and [package.json](package.json). Bump these for every release.

| Platform | Artifact | Built by | Needs your account/keys |
|----------|----------|----------|--------------------------|
| Android  | `.aab` (Play) / `.apk` (sideload) | EAS Build (cloud) | Expo account; Google Play ($25) for store |
| iOS      | `.ipa` | EAS Build (cloud) | Expo account; Apple Developer ($99/yr) |
| Windows  | static web / PWA (`dist/`) | `expo export` (local, done) | none |

EAS builds run on Expo's servers and handle signing for you — **no Mac required** for iOS.
You just need an Expo account and (for store builds) the respective developer accounts.

---

## 0. One-time setup

```powershell
npm i -g eas-cli
eas login                 # your Expo account
eas build:configure       # links this project to an EAS project id (writes extra.eas.projectId)
```

---

## 1. Android

**Sideloadable APK** (share a file, no store):
```powershell
eas build --platform android --profile preview
```
EAS prompts to generate an upload keystore the first time (it stores it for you).
When done it prints a URL to download the `.apk`. Install on any device with "unknown sources" enabled.

**Play Store bundle:**
```powershell
eas build --platform android --profile production    # produces .aab
eas submit --platform android --profile production    # uploads to Play Console
```

## 2. iOS

```powershell
eas build --platform ios --profile preview            # internal/TestFlight-style .ipa
# or production + submit:
eas build --platform ios --profile production
eas submit --platform ios --profile production         # uploads to App Store Connect
```
First run, log in with your Apple Developer account when prompted — EAS creates the
bundle id (`com.orbitms.lifterprotocol`), certs, and provisioning profiles automatically.

> Build both stores at once: `eas build --platform all --profile production`.

## 3. Windows (web / PWA)

Already built and verified — output is in `dist/`:
```powershell
npx expo export --platform web        # regenerate dist/
```

Ship it any of these ways:
- **Host it** (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3): upload `dist/`. Users
  open it in any browser on Windows and can "Install app" (PWA) from the address bar.
- **Local preview:** `npx serve dist`
- **Native desktop wrapper (optional):** wrap `dist/` with [Tauri](https://tauri.app)
  (tiny, Rust) or Electron to produce a `.exe`/`.msi` installer. Not set up here — add later
  if a true desktop installer is required.

> ⚠️ Set `expo.extra.coachApiUrl` in [app.json](app.json) to your **deployed** coach
> backend URL before building for release — `localhost` only works on the dev machine.
> The web build also ships no API key (the proxy holds it), so it's safe to host publicly.

---

## 4. Tag the release

```powershell
git tag -a v1.0.0 -m "Lifter Protocol v1.0.0"
git push origin v1.0.0
```
Then on github.com → **Releases → Draft a new release → choose tag `v1.0.0`**, and attach
the EAS `.apk`/`.ipa` download links (or the files) and the hosted web URL.

## 5. Over-the-air updates (optional, after first native release)

Once v1.0.0 is installed on devices, JS-only changes ship instantly without a rebuild:
```powershell
npm i -g eas-cli           # if not already
eas update --branch production --message "fix copy"
```
(`runtimeVersion` is pinned to `appVersion`, so OTA updates only reach matching native builds.)
