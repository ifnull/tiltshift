# Running on a physical device

If you see **"No script URL provided"** when running on a test device, the app has no way to load the JavaScript bundle. Fix it as follows.

## Option A: Development (load JS from your Mac)

The app loads the bundle from the **Metro bundler** on your computer. You must:

1. **Start Metro first** (in the project root):
   ```bash
   npx expo start
   ```
   Leave this running.

2. **Build and run on the device** (same machine, second terminal):
   ```bash
   npx expo run:ios --device
   ```
   Or in Xcode: choose your physical device and Run (▶️).

3. **Same network**: Phone and Mac must be on the same Wi‑Fi (or the device must be able to reach your Mac). On iOS, allow **Local Network** access for the app if prompted.

If you build/run from **Xcode** with a **Debug** scheme, Metro is not started automatically—always start `npx expo start` before running on the device.

## Option B: Standalone build (JS embedded, no Metro)

For a build that runs without Metro (e.g. TestFlight, ad‑hoc, or installing on a device without a Mac nearby):

- **EAS Build** (recommended):
  ```bash
  eas build --profile preview --platform ios
  ```
  Then install the resulting build on the device. The JS bundle is embedded in the app.

- **Xcode Archive**: Use the **Release** scheme and archive. The “Bundle React Native code and images” phase must run (it does when configuration is Release) so that `main.jsbundle` is embedded. If the embedded bundle is missing, the app will try to load from Metro as a fallback when you have it running.

## Summary

| Goal                         | Do this                                                                 |
|-----------------------------|-------------------------------------------------------------------------|
| Dev on device with hot reload | Start `npx expo start`, then `npx expo run:ios --device` (same Wi‑Fi).  |
| Install build without Metro  | Use `eas build --profile preview` (or production) and install the IPA. |
