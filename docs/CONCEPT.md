# TiltSync - Concept Document

A mobile application that helps DIY solar panel installers achieve optimal panel alignment using device sensors, intuitive visual feedback, and haptic guidance.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Target Users](#target-users)
4. [Core Features](#core-features)
5. [Alignment Modes](#alignment-modes)
6. [User Experience](#user-experience)
7. [Technical Architecture](#technical-architecture)
8. [Solar Calculation Reference](#solar-calculation-reference)
9. [Future Considerations](#future-considerations)

---

## Problem Statement

DIY solar panel installers face a common challenge: determining the optimal angle and direction to mount their panels for maximum energy production. While professional installers use specialized equipment and software, hobbyists and DIYers often resort to guesswork or complex manual calculations.

**Key Pain Points:**
- Calculating optimal tilt angle requires knowledge of latitude and solar geometry
- No intuitive way to physically align a panel to a specific angle
- Direction (azimuth) alignment is often overlooked
- Different use cases require different optimization strategies (fixed vs. seasonal adjustment)

---

## Solution Overview

**TiltSync** transforms a smartphone into a precision alignment tool by leveraging built-in sensors:

- **Accelerometer** → Measures current panel tilt angle
- **Magnetometer** → Determines compass heading for azimuth alignment
- **GPS** → Obtains location (latitude/longitude) and altitude for calculations

The app presents this data through an intuitive **bubble level interface** that shows both the current angle and the target angle, with color-coded feedback and haptic pulses that guide the user to perfect alignment.

---

## Target Users

### Primary: Set-and-Forget Installers
- Homeowners installing rooftop or ground-mount systems
- Want to install once and maximize year-round production
- Moderate technical knowledge
- **Default mode: Year-Round optimization**

### Secondary: Seasonal Adjusters
- Enthusiasts with adjustable mounting systems
- Willing to adjust panels 2-4 times per year
- Want to squeeze extra efficiency from their system
- **Mode: Seasonal optimization**

### Tertiary: Mobile/Camping Users
- RV owners, campers, off-grid enthusiasts
- Portable panel setups
- Frequently relocating
- Want maximum power at current location and time
- **Mode: Daily optimization**

---

## Core Features

### 1. Bubble Level Interface

The primary interface mimics a traditional bubble level, providing an immediately intuitive experience.

```
┌─────────────────────────────────────────┐
│            ☀️ TILTSYNC                  │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  Year-Round │ Seasonal │ Daily  │   │
│   └─────────────────────────────────┘   │
│                                         │
│         Current Tilt: 28.4°             │
│         Target Tilt:  35.0°             │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │             ┌───┐               │   │
│   │             │ ○ │ ← bubble      │   │
│   │             └───┘               │   │
│   │                                 │   │
│   │               ◎  ← target       │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ████████████░░░░░░  81% aligned       │
│                                         │
│        ┌──────────────────┐             │
│        │  🧭 Compass Mode │             │
│        └──────────────────┘             │
│                                         │
│   📍 Austin, TX (30.27°N, 97.74°W)      │
│   🏔️ Altitude: 149m                     │
└─────────────────────────────────────────┘
```

**Key Elements:**
- **Mode Selector**: Toggle between Year-Round, Seasonal, and Daily modes
- **Angle Display**: Shows current measured tilt and calculated target
- **Bubble**: Real-time position based on accelerometer data
- **Target Marker**: Fixed position representing optimal angle
- **Progress Bar**: Visual percentage of alignment accuracy
- **Location Info**: Current GPS coordinates and altitude

### 2. Compass Mode

Secondary interface for azimuth (directional) alignment.

```
┌─────────────────────────────────────────┐
│            🧭 COMPASS MODE              │
│                                         │
│         Current: 156° (SSE)             │
│         Target:  180° (S)               │
│                                         │
│              ┌─────────┐                │
│           N  │         │                │
│         ╱    │    ▲    │    ╲           │
│       W      │    │    │      E         │
│         ╲    │    │    │    ╱           │
│           S  │  ──┼──  │                │
│              │    ◎    │ ← target       │
│              └─────────┘                │
│                                         │
│   ████████████████░░░  87% aligned      │
│                                         │
│        ┌──────────────────┐             │
│        │  📐 Tilt Mode    │             │
│        └──────────────────┘             │
│                                         │
│   Hemisphere: Northern                  │
│   Optimal Direction: South              │
└─────────────────────────────────────────┘
```

**Key Elements:**
- **Heading Display**: Current compass heading and cardinal direction
- **Target Direction**: Optimal panel facing direction
- **Compass Rose**: Visual compass with directional indicator
- **Target Arc**: Shows acceptable azimuth range

### 3. Color Feedback System

A universal color scheme indicates alignment quality across both modes:

| Status | Color | Tilt Deviation | Azimuth Deviation |
|--------|-------|----------------|-------------------|
| **Best** | Green | ≤ 2° | ≤ 5° |
| **Good** | Yellow/Amber | ≤ 5° | ≤ 15° |
| **Bad** | Red | > 5° | > 15° |

Colors are applied to:
- The bubble/compass indicator
- The progress bar
- Background gradient (subtle)
- Target ring glow

### 4. Haptic Feedback

Progressive haptic feedback guides users without requiring constant screen viewing:

| Proximity to Target | Haptic Pattern |
|--------------------|----------------|
| Far (> 10°) | No haptics |
| Approaching (5-10°) | Slow pulse every 500ms |
| Close (2-5°) | Medium pulse every 250ms |
| Very Close (< 2°) | Rapid pulse every 100ms |
| Locked (< 0.5°) | Single strong confirmation + pause |

This allows users to feel their way to alignment while physically adjusting the panel.

---

## Alignment Modes

### Year-Round Mode (Default)

**Use Case:** Fixed installations optimized for maximum annual energy production.

**Calculation:**
```
Optimal Tilt Angle = Latitude
```

For a location at 35°N latitude, the optimal year-round tilt is 35°.

**Azimuth:**
- Northern Hemisphere: Face **South** (180°)
- Southern Hemisphere: Face **North** (0°)

**Why This Works:** The Earth's axis tilt causes the sun's path to vary seasonally. A tilt angle equal to latitude provides the best compromise for year-round performance.

### Seasonal Mode

**Use Case:** Adjustable mounting systems where users want to optimize per season.

**Calculation:**
```
Summer (Apr-Sep):  Tilt = Latitude - 15°
Winter (Oct-Mar):  Tilt = Latitude + 15°
```

**Variations (Advanced):**
```
Spring/Fall Equinox:  Tilt = Latitude
Summer Solstice:      Tilt = Latitude - 23.5°
Winter Solstice:      Tilt = Latitude + 23.5°
```

**UI Additions:**
- Season selector or automatic detection based on date
- Recommended adjustment dates
- Energy gain estimate vs. year-round setting

### Daily Mode

**Use Case:** Portable panels, camping, or maximum power needed today.

**Calculation:** Real-time solar position tracking using astronomical formulas.

```
Day of Year (N) = current day number (1-365)

Solar Declination (δ):
δ = 23.45° × sin(360/365 × (N - 81))

Hour Angle (H):
H = 15° × (Solar Time - 12)

Solar Altitude (α):
sin(α) = sin(Lat) × sin(δ) + cos(Lat) × cos(δ) × cos(H)

Optimal Tilt = 90° - α
```

**UI Additions:**
- Time-based updates (panel angle changes throughout day)
- Current sun position visualization
- Sunrise/sunset times
- Peak solar window indicator

---

## User Experience

### First Launch Flow

1. **Welcome Screen**: Brief app explanation with illustration
2. **Permission Requests**: 
   - Location (required for calculations)
   - Motion sensors (required for level)
3. **Quick Tutorial**: 3-step overlay showing how to use the bubble level
4. **Main Screen**: Launches directly to Year-Round mode

### Main Interaction Loop

1. User places phone flat on solar panel surface
2. App displays current tilt angle via accelerometer
3. Target angle calculated based on GPS location and selected mode
4. Bubble shows deviation from target
5. User tilts panel, watching bubble approach target
6. Haptic feedback intensifies as alignment improves
7. Green indicator + confirmation haptic when aligned
8. User switches to Compass Mode for azimuth alignment
9. Process repeats for directional alignment

### Edge Cases

**No GPS Signal:**
- Allow manual coordinate entry
- Show last known location with warning
- Provide common city presets

**Sensor Unavailable:**
- Graceful degradation with explanation
- Manual angle entry option

**Extreme Latitudes (> 66°):**
- Warning about seasonal sun availability
- Adjusted recommendations for arctic/antarctic regions

---

## Technical Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React Native + Expo | Cross-platform mobile development |
| Language | TypeScript | Type-safe development |
| Sensors | expo-sensors | Accelerometer, Magnetometer access |
| Location | expo-location | GPS coordinates and altitude |
| Haptics | expo-haptics | Native haptic feedback |
| Animation | React Native Animated / Reanimated | Smooth bubble movement |
| UI | React Native core + LinearGradient | Native components |

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      DEVICE SENSORS                          │
├──────────────────┬──────────────────┬───────────────────────┤
│   Accelerometer  │   Magnetometer   │        GPS            │
│   (x, y, z)      │   (heading)      │   (lat, lon, alt)     │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌────────────────┐ ┌────────────────┐  ┌─────────────────────┐
│  Calculate     │ │   Normalize    │  │  Calculate Optimal  │
│  Current Tilt  │ │   Heading      │  │  Angles (mode-based)│
└───────┬────────┘ └───────┬────────┘  └──────────┬──────────┘
        │                  │                      │
        ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ALIGNMENT ENGINE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Compare   │  │  Calculate  │  │  Determine Status   │  │
│  │   Angles    │  │  Deviation  │  │  (Best/Good/Bad)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────────┐
│  Bubble/      │  │    Color       │  │      Haptic        │
│  Compass UI   │  │    Indicator   │  │      Feedback      │
└───────────────┘  └────────────────┘  └────────────────────┘
```

### Component Structure

```
src/
├── App.tsx                     # Root component, navigation setup
│
├── screens/
│   ├── AlignmentScreen.tsx     # Main bubble level screen
│   └── CompassScreen.tsx       # Compass mode screen
│
├── components/
│   ├── BubbleLevel.tsx         # Animated bubble level visualization
│   ├── TargetRing.tsx          # Target position indicator
│   ├── CompassView.tsx         # Compass rose with heading
│   ├── ModeSelector.tsx        # Year-Round/Seasonal/Daily tabs
│   ├── AngleDisplay.tsx        # Current/Target angle readout
│   ├── AlignmentIndicator.tsx  # Progress bar with color
│   └── LocationDisplay.tsx     # GPS coordinates display
│
├── hooks/
│   ├── useAccelerometer.ts     # Accelerometer subscription + tilt calc
│   ├── useMagnetometer.ts      # Magnetometer subscription + heading
│   ├── useLocation.ts          # GPS location + altitude
│   ├── useHapticFeedback.ts    # Proximity-based haptic triggers
│   └── useOptimalAngle.ts      # Combines location + mode for target
│
├── utils/
│   ├── solarCalculations.ts    # Sun position, declination, hour angle
│   ├── alignmentStatus.ts      # Status determination (best/good/bad)
│   ├── angleConversions.ts     # Degree/radian helpers
│   └── constants.ts            # Thresholds, colors, haptic patterns
│
└── types/
    └── index.ts                # TypeScript interfaces
```

### Key Type Definitions

```typescript
// Alignment modes
type AlignmentMode = 'year-round' | 'seasonal' | 'daily';

// Season for seasonal mode
type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Alignment quality status
type AlignmentStatus = 'best' | 'good' | 'bad';

// Location data from GPS
interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
}

// Calculated optimal angles
interface OptimalAngles {
  tilt: number;          // degrees from horizontal
  azimuth: number;       // degrees from north (0-360)
  hemisphere: 'northern' | 'southern';
}

// Current device orientation
interface DeviceOrientation {
  tilt: number;          // current tilt angle
  heading: number;       // compass heading
}

// Alignment calculation result
interface AlignmentResult {
  tiltDeviation: number;
  azimuthDeviation: number;
  tiltStatus: AlignmentStatus;
  azimuthStatus: AlignmentStatus;
  tiltPercentage: number;   // 0-100
  azimuthPercentage: number; // 0-100
}
```

---

## Solar Calculation Reference

### Year-Round Optimal Tilt

The optimal year-round tilt angle equals the location's latitude:

```
Optimal Tilt = |Latitude|
```

This is a simplification that works well for most locations between 25° and 50° latitude.

### Seasonal Adjustments

More precise seasonal adjustments account for the Earth's 23.45° axial tilt:

```
Summer Solstice (Jun 21):  Tilt = Latitude - 23.45°
Winter Solstice (Dec 21):  Tilt = Latitude + 23.45°
Equinoxes (Mar 21, Sep 21): Tilt = Latitude
```

### Daily Sun Position

For real-time sun tracking, we calculate the sun's position in the sky:

**1. Day of Year (N):**
```
N = days since January 1st (1-365)
```

**2. Solar Declination (δ):**
```
δ = 23.45° × sin((360/365) × (N - 81))
```

**3. Solar Noon Hour Angle:**
```
H = 15° × (hour - 12)
where hour is solar time (not clock time)
```

**4. Solar Altitude Angle (α):**
```
sin(α) = sin(φ) × sin(δ) + cos(φ) × cos(δ) × cos(H)

where φ = latitude
```

**5. Optimal Panel Tilt:**
```
Optimal Tilt = 90° - α
```

### Azimuth Direction

**Northern Hemisphere (Latitude > 0):**
- Optimal azimuth = 180° (due South)

**Southern Hemisphere (Latitude < 0):**
- Optimal azimuth = 0° (due North)

**Variation:**
- East of true south/north: Morning bias (more morning energy)
- West of true south/north: Afternoon bias (more afternoon energy)

---

## Future Considerations

### Potential Enhancements

1. **AR Mode**: Augmented reality overlay showing sun path on camera view
2. **Energy Estimator**: Calculate expected kWh based on panel specs and alignment
3. **Weather Integration**: Adjust recommendations based on local cloud patterns
4. **Multi-Panel Support**: Save and name multiple panel configurations
5. **Historical Data**: Track adjustments over time with production correlation
6. **Offline Mode**: Full functionality without network connection
7. **Widget**: Home screen widget showing current optimal angle
8. **Notifications**: Seasonal reminders to adjust panels

### Accessibility

- VoiceOver/TalkBack support for angle readouts
- High contrast mode option
- Larger touch targets for outdoor use with gloves
- Audio feedback option in addition to haptics

### Localization

- Support for multiple languages
- Unit preferences (metric/imperial for altitude)
- Regional date formats for seasonal mode

---

## Summary

TiltSync transforms the complex task of solar panel alignment into an intuitive, sensor-guided experience. By combining the familiar bubble level metaphor with modern smartphone sensors and haptic feedback, users can achieve professional-grade alignment without specialized equipment or deep technical knowledge.

The three-mode system (Year-Round, Seasonal, Daily) accommodates the full spectrum of users from set-and-forget homeowners to active off-grid enthusiasts, while the color-coded feedback and progressive haptics make the alignment process both efficient and satisfying.
