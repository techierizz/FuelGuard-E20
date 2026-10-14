/*
  ======================================================================================
  FuelGuard E20 - Full Production Cloud Telemetry & Diagnostic Firmware (CALIBRATED)
  ======================================================================================
  Target: ESP32-S3 Dev Module
  Purpose: Real-time dual-stage moisture extraction, 940 nm infrared optical phase
           separation detection, interactive bench calibration, and Vercel/Firestore
           cloud synchronization for the FuelGuard E20 Web & Android App.

  WIRING PLAN:
    - DHT22 Inlet (Air Intake, before Silica Gel)   -> GPIO 5
    - DHT22 Outlet (Conditioned Air, after Gel)      -> GPIO 4
    - IR Transmitter LED (940 nm)                   -> GPIO 7 (through 330 ohm resistor)
    - Photodiode Receiver Signal (ADC)              -> GPIO 1 (Anode + 10k to GND, Cathode to 3.3V)

  LIBRARIES REQUIRED (Install in Arduino IDE Library Manager):
    - "DHT sensor library" by Adafruit
    - "Adafruit Unified Sensor" by Adafruit
    - "ArduinoJson" by Benoit Blanchon (version 6.x or 7.x)

  INTERACTIVE SERIAL COMMANDS:
    - 'b' -> Auto-Calibrate baseline to current clear tube
    - '+' -> Increase safety threshold by 10 counts
    - '-' -> Decrease safety threshold by 10 counts
    - 't' -> Toggle IR LED permanently ON/OFF (Phone camera purple glow test)
    - 's' -> Trigger immediate cloud telemetry upload
    - 'h' -> Print hardware pinout & troubleshooting guide
  ======================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ------------------- PIN DEFINITIONS -------------------
#define DHT_INLET_PIN   5    // 1st DHT22: Pre-silica gel
#define DHT_OUTLET_PIN  4    // 2nd DHT22: Post-silica gel
#define DHTTYPE         DHT22
#define IR_LED_PIN      7    // 940 nm IR Emitter
#define PHOTO_ADC_PIN   1    // Photodiode ADC Input (12-bit)

// ------------------- CLOUD & NETWORK CONFIG ------------
// 1. Enter your Wi-Fi router or Phone Mobile Hotspot details:
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Your deployed Vercel endpoint:
const char* API_URL       = "https://fuelguard-e20.vercel.app/api/ingest";

// 3. Security token (matches DEVICE_TOKEN on Vercel):
const char* DEVICE_TOKEN  = "FuelGuard_Secret_Key_2026";

// ------------------- TIMING & THRESHOLDS ---------------
const unsigned long SEND_INTERVAL_MS = 5000; // Cloud sync every 5 seconds
const int ADC_SAMPLES = 48;                  // Multi-sample averaging
const int LED_SETTLE_MS = 15;                // Settle time before reading ADC

// Dynamic Optical Threshold (Calibrated for clear tube baseline):
int phaseSeparationThreshold = 50;           // Baseline > 50 -> SAFE
int calibratedBaseline = 84;                 // Initial default empty tube baseline

// ------------------- GLOBALS ---------------------------
DHT dhtInlet(DHT_INLET_PIN, DHTTYPE);
DHT dhtOutlet(DHT_OUTLET_PIN, DHTTYPE);

unsigned long lastSend = 0;
unsigned long uploadCycleCount = 0;
bool manualLedOn = false;

// Convert 12-bit ADC count (0 - 4095) to Millivolts (3.3V reference)
float adcToMillivolts(uint16_t adc) {
  return ((float)adc * 3300.0f) / 4095.0f;
}

// Multi-sample ADC averaging to eliminate ambient electronic noise
uint16_t readAverageADC() {
  uint32_t sum = 0;
  for (int i = 0; i < ADC_SAMPLES; i++) {
    sum += analogRead(PHOTO_ADC_PIN);
    delayMicroseconds(500);
  }
  return (uint16_t)(sum / ADC_SAMPLES);
}

// Differential optical measurement (Ambient light subtraction)
bool measureOptical(uint16_t &offVal, uint16_t &onVal, int32_t &delta) {
  // 1. Ambient Baseline (LED OFF)
  digitalWrite(IR_LED_PIN, LOW);
  delay(LED_SETTLE_MS);
  offVal = readAverageADC();

  // 2. Transmitted Illumination (LED ON)
  digitalWrite(IR_LED_PIN, HIGH);
  delay(LED_SETTLE_MS);
  onVal = readAverageADC();

  // 3. Return LED to LOW
  digitalWrite(IR_LED_PIN, LOW);

  // 4. Optical Delta
  delta = (int32_t)onVal - (int32_t)offVal;
  return (offVal > 0 || onVal > 0) && abs(delta) >= 3;
}

// Wi-Fi Connection Manager
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("\n[WiFi] Connecting to \"%s\"", WIFI_SSID);
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] Connected successfully! IP: %s | RSSI: %d dBm\n\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println(F("[WiFi] Could not connect to Wi-Fi. (Will retry on next cycle)"));
    Serial.println(F("       Note: Sensor readings and local calibration will continue running offline."));
  }
}

// Run dynamic optical auto-calibration
void runAutoCalibration() {
  uint16_t bOff = 0, bOn = 0;
  int32_t bDelta = 0;
  measureOptical(bOff, bOn, bDelta);
  calibratedBaseline = (int)bDelta;
  phaseSeparationThreshold = (int)(bDelta * 0.60f); // 60% of baseline
  if (phaseSeparationThreshold < 10) phaseSeparationThreshold = 10;

  Serial.println(F("\n=================================================================="));
  Serial.println(F(">>> [AUTO-CALIBRATION COMPLETE] Baseline Locked!"));
  Serial.printf (F("    Clear Tube Reading   : %d counts (%.1f mV)\n"), calibratedBaseline, adcToMillivolts(calibratedBaseline));
  Serial.printf (F("    New Safety Threshold : %d counts (60%% of baseline)\n"), phaseSeparationThreshold);
  Serial.printf (F("    -> Current reading (%d counts) is >= %d --> [ SAFE ]\n"), calibratedBaseline, phaseSeparationThreshold);
  Serial.println(F("    -> When tube is blocked or phase-separated --> [ NOT SAFE ]"));
  Serial.println(F("==================================================================\n"));
}

void printHeader() {
  Serial.println(F("\n================================================================================"));
  Serial.println(F("       FUELGUARD E20 - FULL CLOUD TELEMETRY & DIAGNOSTIC SYSTEM       "));
  Serial.println(F("================================================================================"));
  Serial.println(F("  Target MCU     : ESP32-S3 Dev Module"));
  Serial.println(F("  DHT22 Inlet    : GPIO 5 (Air Intake, before Silica Gel)"));
  Serial.println(F("  DHT22 Outlet   : GPIO 4 (Conditioned Air, after Silica Gel)"));
  Serial.println(F("  IR LED (940nm) : GPIO 7 (Emitter with series resistor)"));
  Serial.println(F("  Photodiode ADC : GPIO 1 (12-bit ADC, Anode to GPIO 1 + 10k to GND)"));
  Serial.printf (F("  Safety Rule    : Optical Delta >= %d counts -> SAFE\n"), phaseSeparationThreshold);
  Serial.printf (F("  Cloud API      : %s\n"), API_URL);
  Serial.println(F("--------------------------------------------------------------------------------"));
  Serial.println(F("  INTERACTIVE SERIAL COMMANDS:"));
  Serial.println(F("    'b' -> Auto-Calibrate baseline to current clear tube"));
  Serial.println(F("    '+' -> Increase threshold by 10 counts"));
  Serial.println(F("    '-' -> Decrease threshold by 10 counts"));
  Serial.println(F("    't' -> Toggle IR LED permanently ON/OFF (Phone camera test)"));
  Serial.println(F("    's' -> Trigger immediate cloud telemetry sync"));
  Serial.println(F("    'h' -> Pinout & Troubleshooting guide"));
  Serial.println(F("================================================================================\n"));
}

void printWiringHelp() {
  Serial.println(F("\n------------------------- HARDWARE WIRING & TROUBLESHOOTING -------------------------"));
  Serial.println(F("1. DHT22 SENSORS:"));
  Serial.println(F("   - Inlet Sensor  : VCC -> 3.3V, GND -> GND, DATA -> GPIO 5"));
  Serial.println(F("   - Outlet Sensor : VCC -> 3.3V, GND -> GND, DATA -> GPIO 4"));
  Serial.println(F("   * Note: If getting 'NAN' (Not a Number), verify 3.3V power and pull-up resistor."));
  Serial.println(F(""));
  Serial.println(F("2. 940 nm IR TRANSMITTER LED:"));
  Serial.println(F("   - Anode (Long leg)  -> 330 ohm resistor -> GPIO 7"));
  Serial.println(F("   - Cathode (Short)   -> GND"));
  Serial.println(F("   * Tip: 940nm IR is invisible to human eyes! Open your phone camera and point at it;"));
  Serial.println(F("          you will see a faint purple/violet glow when pulsed or turned on with 't'."));
  Serial.println(F(""));
  Serial.println(F("3. PHOTODIODE RECEIVER:"));
  Serial.println(F("   - Cathode (Long leg / reverse biased) -> 3.3V"));
  Serial.println(F("   - Anode (Short leg)                  -> GPIO 1 AND 10k resistor to GND."));
  Serial.println(F("   * Note: If ADC is constantly 0-2, check polarity or ensure photodiode is reverse-biased."));
  Serial.println(F("-------------------------------------------------------------------------------------\n"));
}

// Upload live telemetry to Vercel Serverless Function / Firestore
void sendCloudTelemetry(float inRH, float outRH, float inTemp, float outTemp, 
                        uint16_t ledOff, uint16_t ledOn, int32_t optDelta, 
                        bool moistureOk, bool opticalOk) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("  [CLOUD] Upload skipped (No Wi-Fi)."));
      return;
    }
  }

  // Prevent sending to dummy placeholder domain
  if (String(API_URL).indexOf("YOUR-VERCEL-DOMAIN") >= 0) {
    Serial.println(F("  [CLOUD NOTICE] Please update API_URL in firmware with your deployed Vercel domain."));
    return;
  }

  StaticJsonDocument<512> doc;
  doc["inletHumidity"] = inRH;
  doc["outletHumidity"] = outRH;
  doc["inletTemperature"] = inTemp;
  doc["outletTemperature"] = outTemp;
  doc["opticalLedOff"] = ledOff;
  doc["opticalLedOn"] = ledOn;
  doc["opticalDifference"] = optDelta;
  doc["moistureSensorOk"] = moistureOk;
  doc["opticalSensorOk"] = opticalOk;
  doc["firmwareUptimeMs"] = (uint32_t)millis();

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(API_URL)) {
    Serial.println(F("  [CLOUD ERROR] Failed to initialize HTTPS connection. Check API_URL."));
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  int httpCode = http.POST(payload);
  Serial.printf(F("  [CLOUD] POST Status: %d\n"), httpCode);

  if (httpCode == 200) {
    Serial.println(F("  [CLOUD SUCCESS] Live telemetry stored in Firestore & pushed to App!"));
  } else if (httpCode > 0) {
    Serial.printf(F("  [CLOUD RESPONSE] %s\n"), http.getString().c_str());
  } else {
    Serial.printf(F("  [CLOUD ERROR] %s\n"), http.errorToString(httpCode).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);

  // Allow up to 2.5s for Serial Monitor attachment
  unsigned long startWait = millis();
  while (!Serial && (millis() - startWait < 2500)) {
    delay(10);
  }
  delay(400);

  pinMode(IR_LED_PIN, OUTPUT);
  digitalWrite(IR_LED_PIN, LOW);

  // Configure 12-bit ADC with 11dB attenuation
  analogReadResolution(12);
  analogSetPinAttenuation(PHOTO_ADC_PIN, ADC_11db);

  dhtInlet.begin();
  dhtOutlet.begin();

  printHeader();
  connectWiFi();
}

void loop() {
  // Check for interactive user commands from Serial Monitor
  if (Serial.available()) {
    char cmd = Serial.read();

    if (cmd == 'b' || cmd == 'B') {
      runAutoCalibration();
      return;
    } else if (cmd == '+') {
      phaseSeparationThreshold += 10;
      Serial.printf(F("\n>>> [MANUAL ADJUST] Threshold increased to: %d counts\n\n"), phaseSeparationThreshold);
      return;
    } else if (cmd == '-') {
      phaseSeparationThreshold = max(10, phaseSeparationThreshold - 10);
      Serial.printf(F("\n>>> [MANUAL ADJUST] Threshold decreased to: %d counts\n\n"), phaseSeparationThreshold);
      return;
    } else if (cmd == 't' || cmd == 'T') {
      manualLedOn = !manualLedOn;
      digitalWrite(IR_LED_PIN, manualLedOn ? HIGH : LOW);
      Serial.print(F("\n>>> [MANUAL TEST] IR LED on GPIO 7 forced: "));
      Serial.println(manualLedOn ? F("ON (Point phone camera to see purple glow!)") : F("OFF"));
      return;
    } else if (cmd == 's' || cmd == 'S') {
      Serial.println(F("\n>>> [MANUAL SYNC] Triggering immediate cloud upload..."));
      lastSend = 0; // Triggers immediate loop execution
    } else if (cmd == 'h' || cmd == 'H') {
      printWiringHelp();
      return;
    }
  }

  // Periodic Telemetry & Diagnostic Cycle
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    uploadCycleCount++;

    // -------------------------------------------------------------
    // 1. READ MOISTURE SYSTEM (DUAL DHT22 SENSORS)
    // -------------------------------------------------------------
    float inRH = dhtInlet.readHumidity();
    float inTemp = dhtInlet.readTemperature();
    float outRH = dhtOutlet.readHumidity();
    float outTemp = dhtOutlet.readTemperature();

    bool inOk = !isnan(inRH) && !isnan(inTemp);
    bool outOk = !isnan(outRH) && !isnan(outTemp);
    bool moistureOk = inOk && outOk;

    float deltaRH = moistureOk ? (inRH - outRH) : 0.0f;
    float dryingEff = (moistureOk && inRH > 0.0f) ? ((inRH - outRH) / inRH * 100.0f) : 0.0f;
    float deltaTemp = moistureOk ? (outTemp - inTemp) : 0.0f;

    // -------------------------------------------------------------
    // 2. READ OPTICAL SYSTEM (IR LED + PHOTODIODE)
    // -------------------------------------------------------------
    uint16_t ledOff = 0, ledOn = 0;
    int32_t optDelta = 0;
    bool opticalOk = measureOptical(ledOff, ledOn, optDelta);

    float optTransmittance = ((float)optDelta / 4095.0f) * 100.0f;
    if (optTransmittance < 0.0f) optTransmittance = 0.0f;

    // -------------------------------------------------------------
    // 3. EVALUATE FUEL STATUS (SAFE vs NOT SAFE)
    // -------------------------------------------------------------
    String fuelStatusStr;
    String fuelDetailStr;

    if (ledOn <= 5 && ledOff <= 5) {
      fuelStatusStr = "CIRCUIT FAULT / CHECK WIRING";
      fuelDetailStr = "Photodiode signal near 0. Check GPIO 1 & photodiode orientation.";
    } else if (optDelta >= phaseSeparationThreshold) {
      fuelStatusStr = "SAFE";
      fuelDetailStr = "Optical path clear (No Phase Separation Detected)";
    } else {
      fuelStatusStr = "NOT SAFE";
      fuelDetailStr = "Phase Separation Detected! High Optical Scatter / Biphasic Interface";
    }

    // -------------------------------------------------------------
    // 4. DISPLAY TERMINAL DASHBOARD
    // -------------------------------------------------------------
    Serial.println(F("--------------------------------------------------------------------------------"));
    Serial.printf("[CYCLE #%lu | UPTIME: %lu sec | WI-FI: %s]\n",
                  uploadCycleCount, millis() / 1000,
                  (WiFi.status() == WL_CONNECTED) ? "CONNECTED" : "OFFLINE");

    // PART A: MOISTURE CONTROL CENTER
    Serial.println(F("\n[1] MOISTURE CONTROL SYSTEM (DUAL DHT22):"));
    if (inOk) {
      Serial.printf("    * INLET SENSOR  [GPIO 5] :  %5.1f %%RH  |  %4.1f °C  [HEALTHY]\n", inRH, inTemp);
    } else {
      Serial.println(F("    * INLET SENSOR  [GPIO 5] :  [FAIL - NAN / CHECK WIRING]"));
    }

    if (outOk) {
      Serial.printf("    * OUTLET SENSOR [GPIO 4] :  %5.1f %%RH  |  %4.1f °C  [HEALTHY]\n", outRH, outTemp);
    } else {
      Serial.println(F("    * OUTLET SENSOR [GPIO 4] :  [FAIL - NAN / CHECK WIRING]"));
    }

    if (moistureOk) {
      Serial.printf("    * NET DIFFERENCE (IN - OUT) :  %+5.1f %%RH\n", deltaRH);
      Serial.printf("    * DRYING EFFICIENCY         :  %5.1f %% water extracted\n", dryingEff);
      Serial.printf("    * TEMPERATURE SPREAD (ΔT)   :  %+5.1f °C\n", deltaTemp);
      if (deltaRH > 15.0f) {
        Serial.println(F("    * DESICCANT STATUS          :  ACTIVE SORPTION (Silica Gel drying air)"));
      } else if (deltaRH > 5.0f) {
        Serial.println(F("    * DESICCANT STATUS          :  MODERATE SORPTION"));
      } else {
        Serial.println(F("    * DESICCANT STATUS          :  SATURATED (Silica Gel regeneration recommended)"));
      }
    }

    // PART B: OPTICAL SENSING & FUEL QUALITY CENTER
    Serial.println(F("\n[2] OPTICAL SENSING PART (940nm IR + PHOTODIODE ADC):"));
    Serial.printf("    * LED OFF (Ambient Dark)  :  %4u counts  (%6.1f mV)\n", ledOff, adcToMillivolts(ledOff));
    Serial.printf("    * LED ON  (Illuminated)   :  %4u counts  (%6.1f mV)\n", ledOn, adcToMillivolts(ledOn));
    Serial.printf("    * TRANSMITTED DELTA (Δ)   :  %+4ld counts  (Transmittance: %4.1f %%) [Threshold: %d]\n", 
                  (long)optDelta, optTransmittance, phaseSeparationThreshold);

    // PART C: FUEL STATUS VERDICT
    Serial.println(F("\n[3] FUEL INTEGRITY DIAGNOSTIC:"));
    if (fuelStatusStr == "SAFE") {
      Serial.printf("    >>> STATUS: [ %s ] <<<\n", fuelStatusStr.c_str());
      Serial.printf("    >>> REASON: %s\n", fuelDetailStr.c_str());
    } else if (fuelStatusStr == "NOT SAFE") {
      Serial.println(F("    >>> STATUS: [ ********** NOT SAFE ********** ] <<<"));
      Serial.printf("    >>> ALERT : %s\n", fuelDetailStr.c_str());
    } else {
      Serial.printf("    >>> STATUS: [ %s ] <<<\n", fuelStatusStr.c_str());
      Serial.printf("    >>> NOTE  : %s\n", fuelDetailStr.c_str());
    }

    // -------------------------------------------------------------
    // 5. TRANSMIT TO CLOUD & APP
    // -------------------------------------------------------------
    Serial.println(F("\n[4] CLOUD & MOBILE APP TELEMETRY:"));
    if (moistureOk) {
      sendCloudTelemetry(inRH, outRH, inTemp, outTemp, ledOff, ledOn, optDelta, moistureOk, opticalOk);
    } else {
      Serial.println(F("  [SKIP CLOUD] Incomplete sensor data (NAN). Check DHT22 wiring."));
    }

    Serial.println(F("--------------------------------------------------------------------------------\n"));
  }
}
