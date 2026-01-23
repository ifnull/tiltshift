# TiltSync

A cross-platform mobile app that helps DIY solar panel installers achieve optimal panel alignment using device sensors, intuitive visual feedback, and haptic guidance.

<p align="center">
  <img src="assets/app-preview.png" alt="TiltSync Preview" width="300" />
</p>

## Features

- **Bubble Level Interface** - Intuitive visual guide showing current vs. target tilt angle
- **Compass Mode** - Align panel direction for optimal sun exposure
- **Three Alignment Modes**:
  - **Year-Round** (default) - Best angle for maximum annual production
  - **Seasonal** - Optimized angles for each season
  - **Daily** - Real-time sun tracking for portable setups
- **Haptic Feedback** - Feel your way to perfect alignment without watching the screen
- **Color-Coded Status** - Instant visual feedback (red → yellow → green)
- **GPS-Based Calculations** - Automatic optimal angle calculation based on your location

## Documentation

For detailed feature specifications, UX flows, and technical architecture, see the **[Concept Document](docs/CONCEPT.md)**.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Sensors | expo-sensors (Accelerometer, Magnetometer) |
| Location | expo-location |
| Haptics | expo-haptics |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- Physical device recommended for sensor testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/app-solar-alignment-optimization.git
   cd app-solar-alignment-optimization
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

### Development with Physical Device

For accurate sensor testing, use a physical device:

1. Install [Expo Go](https://expo.dev/client) on your iOS or Android device
2. Ensure your phone and computer are on the same network
3. Scan the QR code from the Expo dev server

## Project Structure

```
app-solar-alignment-optimization/
├── README.md
├── docs/
│   └── CONCEPT.md              # Detailed design document
├── src/
│   ├── App.tsx                 # Root component
│   ├── screens/
│   │   ├── AlignmentScreen.tsx # Bubble level interface
│   │   └── CompassScreen.tsx   # Compass mode
│   ├── components/
│   │   ├── BubbleLevel.tsx     # Animated bubble visualization
│   │   ├── CompassView.tsx     # Compass rose component
│   │   ├── ModeSelector.tsx    # Mode toggle tabs
│   │   └── AlignmentIndicator.tsx
│   ├── hooks/
│   │   ├── useAccelerometer.ts
│   │   ├── useMagnetometer.ts
│   │   ├── useLocation.ts
│   │   └── useHapticFeedback.ts
│   ├── utils/
│   │   ├── solarCalculations.ts
│   │   └── alignmentStatus.ts
│   └── types/
│       └── index.ts
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

## How It Works

### Optimal Angle Calculation

**Year-Round Mode:**
```
Optimal Tilt = Latitude
```

**Seasonal Mode:**
```
Summer: Tilt = Latitude - 15°
Winter: Tilt = Latitude + 15°
```

**Daily Mode:**
Real-time calculation based on sun position using solar declination and hour angle.

### Azimuth (Direction)

- **Northern Hemisphere**: Face panels South (180°)
- **Southern Hemisphere**: Face panels North (0°)

## Permissions

The app requires the following permissions:

| Permission | Purpose |
|------------|---------|
| Location | Calculate optimal angle based on latitude |
| Motion & Orientation | Measure current panel tilt and compass heading |

## Platform Support

| Platform | Status |
|----------|--------|
| iOS | Primary development target |
| Android | Supported via Expo |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Solar position algorithms adapted from NOAA solar calculations
- Inspired by the needs of DIY solar enthusiasts everywhere
