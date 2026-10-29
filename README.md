# VocalisX — Phase 1 UI

A React + Vite prototype for a silent-speech communication collar. Phase 1 is a browser-only UI with simulated data; it does not yet recognise real speech or consume ESP32 sensor readings.

## Features

- Accessible communication screen with large predicted-text output and quick phrases
- Developer dashboard with simulated sEMG waveform, IMU values, signal activity and event log
- Simulated fixed-vocabulary predictions (Help, Water, Yes, No, Pain, Bathroom, Thank you, I need assistance)
- Communication history with timestamps, clear action, and demo/live-mode status
- Responsive UI and reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

## Phase 1 scope

Sensor signals and model predictions are simulated for interface development. No microphone, speech-to-text service, AI model, ESP32, or real sensor is connected. In later phases, the simulated signal provider can be replaced by the real sensor-stream and classifier interfaces.

## Planned architecture

`EMG/IMU sensors → ESP32-S3 → data transport → signal processing/classifier → UI`

The fixed vocabulary must be validated with labelled data from the intended user. This prototype is not a medical device and should not be relied on as the user's sole communication method.
