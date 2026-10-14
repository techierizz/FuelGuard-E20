# FuelGuard E20 Cloud Dashboard

Responsive React dashboard + Vercel serverless API + Firebase Cloud Firestore + ESP32-S3 firmware.

## Architecture

ESP32-S3 -> HTTPS POST `/api/ingest` (shared device token) -> Vercel API -> Firestore -> dashboard polls `/api/latest` and `/api/history`.

The service account and device token are server-only environment variables. They must never be put in frontend code or committed to a public repository.

## 1. Firebase setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. Create a Cloud Firestore database.
3. In Project settings -> Service accounts, generate a private key for a server-side service account. Keep this JSON private.
4. In Firebase/Google Cloud IAM, grant the service account only the Firestore permissions needed by the app. Do not expose its private key to the browser or device.

## 2. Configure and deploy to Vercel

1. Put this project in a private GitHub repository.
2. Import it into Vercel. Framework preset: Vite (the `api` directory is Vercel serverless functions).
3. In Vercel Project Settings -> Environment Variables, add:
   - `DEVICE_TOKEN`: a long random secret (same secret goes in firmware; rotate if exposed).
   - `DEVICE_ID`: `fuelguard-001` (or your chosen ID).
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the entire service-account JSON as a single-line JSON value. Escape newlines inside `private_key` as `\n`.
4. Redeploy after adding environment variables.
5. Set the deployed domain into `API_URL` in firmware, e.g. `https://your-app.vercel.app/api/ingest`.

The app dashboard endpoints are `/api/latest` and `/api/history`. They are intended for a private prototype dashboard. Before public deployment, add user authentication to those read endpoints or protect the dashboard behind an authenticated access layer. The ingest endpoint is protected by the device token, but a static shared token is a prototype approach, not production-grade device identity.

## 3. Install locally

Requires Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Local frontend can render, but API routes need Vercel's runtime and environment variables. Use `vercel dev` for local API development after installing the Vercel CLI and setting environment variables.

## 4. ESP32-S3 firmware setup

Arduino IDE Library Manager:
- DHT sensor library by Adafruit
- Adafruit Unified Sensor
- ArduinoJson (Benoit Blanchon)

Board: ESP32S3 Dev Module. Upload speed and USB port depend on your board; choose the COM port that appears in Arduino IDE.

### Pin conflict correction

Earlier wiring used GPIO 5 for both DHT22 inlet and optical photodiode. One GPIO cannot reliably serve both. This bundled firmware uses:
- DHT22 inlet OUT -> GPIO 5
- DHT22 outlet OUT -> GPIO 4
- IR LED drive -> GPIO 7 through 330 ohm series resistor
- photodiode signal node -> GPIO 1 ADC

Move the photodiode signal/10k resistor junction from GPIO 5 to GPIO 1. Keep 10k from the ADC node to GND, photodiode cathode to 3.3V, and anode to ADC node. Confirm polarity and actual ADC behavior; the earlier near-zero values indicate the optical circuit may need troubleshooting or a transimpedance amplifier. GPIO 1 must not be shared with another component.

Never connect an ESP32-S3 GPIO/ADC pin to 5V. The 940 nm LED is invisible to the eye; do not stare into it at close range. Keep all electronics away from fuel/vapour; this prototype is not certified for installation in or near an operating fuel tank.

## 5. Data schema

Every upload includes inlet/outlet RH and temperature, LED-off ADC, LED-on ADC, optical delta, sensor flags, firmware uptime and server receipt time. `humidityDifference` is calculated by the server as inlet RH minus outlet RH. The optical channel is raw transmitted-light response, not a calibrated water concentration or phase-separation verdict.

## 6. Troubleshooting

- `401 Unauthorized device`: `DEVICE_TOKEN` in Vercel and firmware must match exactly.
- `500 Could not store reading`: inspect Vercel function logs and verify service account JSON/IAM.
- Dashboard says awaiting device: confirm firmware prints HTTP 200 and URL is correct.
- Dashboard says stale: ESP32 has not uploaded within 30 seconds; check Wi-Fi and server response.
- Optical ADC remains 0-2: verify ADC pin mapping and photodiode circuit. Do not infer fuel quality from near-zero readings.
