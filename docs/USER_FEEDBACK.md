# User Feedback Summary

Notes from user feedback and how we're addressing it.

---

## 1. Grid cost / time-of-use (TOU) — implemented

**Feedback:** Input grid cost per kWh during certain times; provide E–W angle to maximize savings (or sellback cost).

**Status:** Done.

**Possible approach:** Add an optional “Economics” or “Rates” section in Settings:
- Peak/off-peak (or time blocks) with $/kWh and optional sellback rate.
- When enabled, show a recommended azimuth bias (e.g. more west for afternoon peak) and/or a “savings vs ideal” note.
- E–W angle recommendation could be derived from a simple model (e.g. hourly sun position vs rate blocks).

**Implementation:** Settings → Time-of-use rates (toggle + blocks: start/end hour, ¢/kWh; optional sellback). When enabled, optimal azimuth maximizes value over the day; same azimuth on Panel and Compass.

---

## 2. Actual tilt/azimuth → yield estimate and % delta from ideal

**Feedback:** Input actual tilt and azimuth; show estimated yield and its percent delta from ideal. Optionally add temperature coefficient, ambient temp, and max solar angle (e.g. from NOAA Global Monitoring Lab) for estimated daily production.

**Status:** Not yet scoped; aligns with existing “Energy Estimator” idea in CONCEPT.md.

**Possible approach:**
- **Phase 1:** “Yield estimate” screen or panel: user enters (or uses current device) tilt + azimuth; show estimated relative yield and “% of ideal” using existing solar math (no API).
- **Phase 2:** Optional inputs: temperature coefficient, ambient temp; optional NOAA (or similar) clear-sky / irradiance for better daily kWh estimate.

**Challenges:** NOAA integration and temp/coefficient modeling are non-trivial; Phase 1 is feasible with current codebase.

---

## 3. Invert compass 180° — implemented

**Feedback:** When the phone is laid on the panel (screen up), the numbers were confusing until the phone was turned upside down. Request: toggle to invert the display 180°.

**Status:** Done.

**Implementation:**
- **Settings → Display:** “Invert compass 180°” toggle (persisted). Description: use when holding the phone toward the sun or laid screen-down on the panel so the compass reads correctly.
- **Compass screen** and **Panel (dual) screen:** Compass rose rotation uses the inverted state for that orientation.

---

## 4. Daily mode: use date only, not current time — implemented

**Feedback:** Daily button should use only the date, not the current time. Late afternoon showed 90° vertical; user wants “best alignment for the day,” not for that exact moment.

**Status:** Done.

**Implementation:**
- **Daily tilt** is now computed at **solar noon** for the given date (same angle all day).
- Removed the per-minute recalculation for daily mode in `useOptimalAngle` since the angle is date-only.

---

## 5. AR sun path visualization

**Feedback:** Another app used AR to show the sun’s path for the current day with an object at each hour; asking if this could be done with Expo.

**Status:** Research / future idea.

**Notes:**
- **Expo + 3D:** expo-gl with Three.js (or similar) can render 3D sun position from azimuth/altitude; there are examples of “sun position with Expo and Three.js.”
- **Full AR (camera overlay):** Usually needs native AR (ARKit/ARCore) or a custom dev client; not in the default Expo SDK. Options include:
  - expo-three + camera view and 3D overlay (device orientation from expo-sensors).
  - Native AR modules (e.g. Viro, or custom native code) with a dev build.
- **Reference apps:** Alpenglow, Sunlitt, Sun Tracker AR do AR sun path; we could offer a non-AR “sun path” view first (2D/3D on screen), then explore AR in a dev client if needed.

---

## Summary table

| Item                         | Status      | Notes                                      |
|------------------------------|------------|--------------------------------------------|
| Grid cost / TOU, E–W angle   | Considered | Optional setting; design then implement   |
| Yield estimate, % delta     | Considered | Phase 1 without NOAA is doable            |
| Invert compass 180°         | Done       | Settings → Display                         |
| Daily = date only (noon)    | Done       | Solar noon for the day                     |
| AR sun path                 | Future     | 3D in Expo possible; full AR needs dev client |
