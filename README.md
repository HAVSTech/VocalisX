# VocalisX — Phase 1 UI prototype

VocalisX is a browser-based prototype for a wearable silent-speech communication aid. This phase focuses on the communication experience and a developer-facing view of the proposed sEMG/IMU inputs.

> **Important:** All sensor readings, signal waveforms, and sample prediction labels are simulated. No real sensor, ESP32-S3, or trained recognition model is connected. Do not rely on this prototype for emergencies or as a person's only communication method.

## Included in Phase 1

- **Communication view:** large message output, eight quick phrases, keyboard fallback, recent messages, and message repeat.
- **Signal dashboard:** simulated sEMG waveform, mock EMG metrics, mock accelerometer/gyroscope values, stream pause/resume, and pipeline status.
- **Message history:** in-session list, source labels, timestamps, example confidence labels, filters, repeat, and clear history.
- **Responsive interface:** desktop and mobile navigation, visible demo status, and accessibility-oriented output announcements.
- **Deployment configuration:** Vercel build/output settings are defined in `vercel.json`.

## Run locally

Requirements: Node.js 18 or later.

```bash
npm install
npm run dev
```

Create a production build locally:

```bash
npm run build
npm run preview
```

Vite outputs the production site to `dist/`.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Choose the `phase-1-ui` branch to preview the Phase 1 work, or merge it into `main) before deploying production.
3. Use the repository root (`./`) as the root directory.
4. Select Vite as the framework preset. Build command: `npm run build`. Output directory: `dist`.
5. No environment variables are required for this UI-only prototype.

## Intended architecture

```text
sEMG + IMU sensors
       ↓
ESP32-S3 sampling and preprocessing
       ↓
Browser/server data transport
       ↓
Signal filtering + windowing + feature extraction
       ↓
Personalised fixed-vocabulary classifier
       ↓
Predicted text + confidence/uncertainty state
       ↓
VocalisX communication UI
```

The current dashboard uses a mock signal generator in `src/hooks/useDemoSignals.js`. Replace this provider only when the hardware transport and signal format are defined and validated. A classifier must not be represented as accurate until it has been trained and evaluated on labelled recordings from the intended user(s).

## Suggested next phases

1. **Hardware stream:** read sEMG and IMU samples from ESP32-S3 and define a versioned message format.
2. **Signal capture:** record timestamped, labelled trials for a small fixed vocabulary; include rest/no-gesture samples.
3. **Preprocessing:** validate sampling rates, filter noise, segment signal windows, and normalise features.
4. **Personalised classifier:** train and evaluate a baseline model; measure per-class precision/recall and false activations before showing predictions as usable.
5. **Live integration:** replace mock values with real samples and clearly display uncertain or unknown predictions.
6. **User testing and safety:** test comfort, repeatability, false-positive handling, and a non-device fallback with appropriate specialist guidance.

## Safety and privacy notes

This is an experimental assistive-technology prototype, not a medical device. sEMG patterns vary between people and sessions, so personalised calibration and testing are expected. Collect only the data needed, obtain informed consent, and avoid uploading identifiable sensor recordings without explicit permission.
