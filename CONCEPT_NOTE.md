# CONCEPT NOTE: FUELGUARD E20
## Intelligent Dual-Stage Moisture Shield & 940 nm Infrared Optical Phase Separation Protection System with Real-Time Cloud IoT Telemetry

---

### Project Identification & Metadata

* **Project Title:** FuelGuard E20
* **Tagline:** Dual-Action Biofuel Protection: Preventing Moisture Ingress & Continuously Detecting Phase Separation in E20 Petrol via IoT Telemetry
* **Domain / Sector:** Smart Automotive Systems, Biofuel Infrastructure, Clean Energy Transition, Embedded IoT Diagnostics
* **Technology Readiness Level (TRL):** TRL 4/5 (Functional Working Prototype Validated in Simulated & Laboratory Bench Environments)
* **Lead Proponents:** Engineering Research & Development Team
* **Submission Category:** Automotive Innovation, Sustainable Clean-Tech, IoT & Embedded Systems

---

### 1. Executive Summary

As developing and global economies mandate higher ethanol blending in transportation fuels—exemplified by India's national rollout of **E20 petrol (20% anhydrous ethanol + 80% gasoline)**—an overlooked chemical threat endangers vehicle fleets: **the hygroscopic nature of ethanol**. Ethanol actively extracts water vapour from ambient air entering fuel tanks through normal breathing and condensation. Accumulating merely **0.3% to 0.5% water by volume** triggers sudden, irreversible **phase separation**, splitting the fuel into an aggressive, corrosive ethanol-water bottom phase and a stripped low-octane gasoline top phase. Ingesting this water layer causes violent engine knocking, fuel pump seizure, injector clogging, and catastrophic engine stalling.

**FuelGuard E20** provides the first unified cyber-physical solution to this crisis. Unlike existing systems that rely on passive evaporative canisters or manual offline testing, FuelGuard E20 combines:
1. **Active Moisture Prevention:** A precision three-chamber silica-gel desiccant bed with dual DHT22 sensors that extracts incoming humidity ($\Delta RH = RH_{in} - RH_{out}$) before air reaches the tank headspace.
2. **Non-Invasive Optical Detection:** An external 940 nm near-infrared (NIR) spectrophotometric sensor that scans fuel column homogeneity through an intact transparent line, using differential ambient subtraction ($\Delta ADC = ADC_{on} - ADC_{off}$) to detect phase boundaries instantly without touching liquid fuel.
3. **Cloud IoT Ecosystem:** An ESP32-S3 microcontroller running zero-configuration SoftAP captive-portal provisioning (`192.168.4.1`), streaming real-time diagnostic telemetry every 2.5 seconds to a Vercel serverless backend and Firebase Firestore database.
4. **Mobile PWA Dashboard:** A responsive web application delivering real-time **SAFE / NOT SAFE** verdicts, interactive threshold recalibration, Recharts drying/optical curves, and cross-device cloud synchronization.

Built for an estimated mass-production unit cost of **₹580 (~$7.00 USD)**, FuelGuard E20 protects vehicle owners from **₹15,000–₹50,000** in mechanical engine damages, eliminating consumer anxiety and ensuring the long-term reliability of renewable ethanol fuels.

---

### 2. Problem Statement & Industrial Context

#### 2.1 The Chemical Vulnerability of E20 Biofuel
E20 petrol incorporates 20% ethanol ($C_2H_5OH$) by volume. The presence of the polar hydroxyl ($-OH$) group allows ethanol to readily form strong hydrogen bonds with water molecules ($H_2O$). Standard non-polar petroleum hydrocarbons cannot absorb moisture; however, ethanol-blended fuels actively draw moisture from the atmosphere.

#### 2.2 Mechanism of Phase Separation
When fuel sits in a vehicle tank, diurnal temperature swings induce tank breathing (intake of warm, humid air during cooling cycles and expansion during daytime heating). When the dissolved water concentration reaches the water tolerance limit (as low as 3,000 to 5,000 ppm at 20°C):
$$\text{Homogeneous E20} + \text{Moisture} \longrightarrow \text{Phase Separation} \left( \text{Upper Hydrocarbon Layer} + \text{Dense Lower Ethanol-Water Layer} \right)$$
* **Specific Gravity Stratification:** The ethanol-water mixture possesses a specific gravity of ~0.82–0.90, whereas gasoline hydrocarbons float at ~0.74. Consequently, the ethanol completely precipitates to the bottom of the fuel tank.
* **The Engine Ingestion Hazard:** Modern submersible fuel pumps and motorcycle gravity petcocks draw strictly from the tank's lowest point. Upon ignition, the engine is flooded with an incombustible, highly acidic ethanol-water slug, causing instant stalling, backfires, catalytic converter destruction, and galvanic corrosion of brass injectors and steel lines.

#### 2.3 Scale of the Problem
* **National Scale:** In India alone, the E20 mandate impacts **over 250 million internal combustion engines** on the road.
* **Vulnerable Cohort:** Over 150 million legacy vehicles manufactured prior to modern ethanol-compatibility norms (pre-2023) lack corrosion-resistant fuel tanks and fluorocarbon gaskets.
* **Global Exposure:** Brazil, the United States (E15 mandates), and ASEAN nations face identical phase-separation liabilities in coastal and tropical climate belts with sustained relative humidity exceeding 75%.

---

### 3. Proposed Innovation: The FuelGuard E20 Solution

FuelGuard E20 transitions fuel system protection from reactive roadside repairs to **proactive cyber-physical prevention and telemetry-driven diagnostics**.

```
                   [ Ambient Humid Air Ingress ]
                                 │
                 ┌───────────────▼───────────────┐
                 │ Chamber 1: Inlet DHT22 Sensor │ ──► Ambient (Tin, RHin)
                 └───────────────┬───────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │ Chamber 2: Silica Desiccant   │ ──► Moisture Adsorbed
                 └───────────────┬───────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │ Chamber 3: Outlet DHT22 Sensor│ ──► Conditioned (Tout, RHout)
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                     [ Tank Headspace Air ]

  [ 940 nm IR LED ] ──► [ Intact Transparent Tube ] ──► [ Photodiode Receiver ]
    (GPIO 7 Output)          (E20 Fuel Sample)              (GPIO 1 / ADC)
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   ESP32-S3 Controller   │
                    │  (Differential Ingest)  │
                    └────────────┬────────────┘
                                 │ HTTP POST (2.5s)
                                 ▼
                    ┌─────────────────────────┐
                    │   Vercel Serverless     │
                    │   Firebase Firestore    │
                    └────────────┬────────────┘
                                 │ Live JSON Polling
                                 ▼
                    ┌─────────────────────────┐
                    │ FuelGuard Web/PWA App   │
                    │ (SAFE / NOT SAFE Alerts)│
                    └─────────────────────────┘
```

#### The Four Core System Modules:

1. **Moisture-Conditioning Module (Prevention):**  
   Replaces passive breathing hoses with a multi-stage acrylic/polycarbonate desiccant cartridge containing high-capacity spherical silica-gel beads held between 316 stainless-steel retention meshes. An inlet DHT22 sensor records incoming ambient parameters, while an outlet DHT22 measures conditioned air, proving active dehumidification ($\Delta RH = RH_{in} - RH_{out}$).

2. **Optical Fuel-Monitoring Module (Non-Invasive Detection):**  
   Monitors the fuel line using a 940 nm near-infrared LED and an ultra-fast silicon photodiode aligned along a common optical axis outside an intact transparent fuel-grade tube. Clean E20 is transparent to 940 nm light; phase separation causes immediate optical scattering and turbidity, dropping received photons across the photodiode.

3. **ESP32-S3 IoT Edge Controller:**  
   Calculates differential ambient-subtracted optical delta ($\Delta ADC = ADC_{on} - ADC_{off}$) to prevent daylight/shoplight errors. Hosts a captive SoftAP hotspot (`FuelGuard-Setup` at `192.168.4.1`) for zero-touch smartphone Wi-Fi provisioning without code flashing.

4. **Cloud Analytics & Progressive Web Application (PWA):**  
   Deployed on Vercel with Google Firebase Firestore NoSQL persistence. Delivers real-time diagnostic cards, automated safety verdicts, historical drying curves, live threshold calibration, and laptop-to-phone remote demonstration control.

---

### 4. Technical Specifications & Working Principle

#### 4.1 Step-by-Step Functional Workflow

* **Step 1: Ingress Psychrometry:** As fuel is drawn or the tank cools, ambient air enters Chamber 1. Sensor 1 logs ambient relative humidity ($RH_{in}$) and temperature ($T_{in}$).
* **Step 2: Desiccant Adsorption:** Air passes through Chamber 2. Polar silica gel sites physically adsorb water vapour molecules via capillary condensation, capturing up to 35% of its dry weight in water.
* **Step 3: Verification of Moisture Removal:** Sensor 2 in Chamber 3 logs post-desiccant humidity ($RH_{out}$). The controller verifies $\Delta RH = RH_{in} - RH_{out}$. If $\Delta RH \to 0$, the system flags desiccant saturation.
* **Step 4: Differential Optical Interrogation:** The ESP32-S3 samples the photodiode with the 940 nm LED unpowered ($ADC_{off}$), pulses the LED active ($ADC_{on}$), and computes $\Delta ADC = ADC_{on} - ADC_{off}$.
* **Step 5: Edge Safety Classification:**
  * **$\Delta ADC \ge \text{Threshold}$ (Default 40–50 ADC):** Transmitted light is strong $\to$ Classified as **SAFE (Homogeneous E20)**.
  * **$\Delta ADC < \text{Threshold}$:** Beam scattering from micro-droplets/phase boundaries $\to$ Classified as **NOT SAFE (Phase Separation Detected)**.
* **Step 6: Encrypted Cloud Stream:** Telemetry is dispatched via an authenticated HTTP POST payload to the cloud API (`/api/ingest`) over Wi-Fi/LTE every 2.5 seconds.
* **Step 7: Real-Time Mobile & Cloud Dashboard:** Client browsers and smartphones display instant status changes, ray-tracing animations, and historical Recharts analytics within 2 seconds of event occurrence.

#### 4.2 Hardware & Component Pinout Mapping

| Component | Hardware Specification | Interface / GPIO | Primary Functional Role |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-S3 Dual-Core Xtensa LX7 (240 MHz, Wi-Fi 802.11 b/g/n) | On-Board SOC | Sensor acquisition, differential math, captive portal, cloud dispatch |
| **Inlet Sensor** | DHT22 / AM2302 (0–100% RH $\pm 2\%$, -40 to +80°C) | GPIO 5 (Digital) | Measures raw atmospheric air temperature and humidity before drying |
| **Outlet Sensor** | DHT22 / AM2302 (0–100% RH $\pm 2\%$, -40 to +80°C) | GPIO 4 (Digital) | Measures conditioned air entering the fuel tank headspace |
| **IR Transmitter** | 940 nm Gallium Aluminum Arsenide (GaAlAs) LED | GPIO 7 (Digital Pulse) | Narrow-band 940 nm NIR emitter driven via 330 $\Omega$ current limiter |
| **Photodetector** | Silicon PIN Photodiode (peak response at 940 nm) | GPIO 1 (12-bit ADC) | Translates transmitted IR intensity into analog voltage across 10 k$\Omega$ load |
| **Desiccant Bed** | Indicating Type-A Spherical Silica Gel Granules | Inline Chamber 2 | Physical adsorption of airborne water vapour molecules |
| **Sample Conduit** | Fuel-Resistant Chemically Inert Transparent Tubing | Non-invasive clip | Carries fuel sample across the intact optical transceiver path |
| **Enclosure** | Machined / 3D Acrylic 3-Chamber Column with 316 Mesh | Mechanical Frame | Airtight vertical air path mounted onto demonstration fuel tank |

#### 4.3 Cloud Software & Frontend Stack

| Layer | Technology | Key Attributes |
| :--- | :--- | :--- |
| **Cloud Hosting** | Vercel Serverless Edge Functions | Global low-latency API execution (`/api/ingest`, `/api/latest`, `/api/override`) |
| **Database** | Google Firebase Firestore (NoSQL) | Sub-second document writes, time-series telemetry persistence |
| **Frontend Framework** | React 19 + Vite 6 | Lightning-fast Single-Page Application, modular component rendering |
| **Data Visualization** | Recharts SVG Analytics | Synchronized dual-axis historical curves for psychrometry and optical delta |
| **Mobile UX** | Progressive Web App (PWA) | Safe-area notch padding, floating dark-olive glass navigation dock |

---

### 5. Empirical Evidence & Experimental Validation

The working prototype was subjected to rigorous laboratory bench testing to evaluate drying efficiency, optical sensitivity, and cloud latency:

```
[ EXPERIMENTAL OPTICAL TRANSMISSION: HOMOGENEOUS vs. PHASE-SEPARATED E20 ]

Signal (ΔADC)
  ▲
  │   [Clean Single-Phase E20: ΔADC = 85–115]  ──► CLEAR TRANSMISSION (SAFE)
100 ─ ─────────────────────────────────────────────────────────────
  │
 50 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  [Safety Threshold = 40 ADC]
  │
  │   [0.5% Water Contamination: ΔADC = 12–22] ──► SCATTERED BEAM (NOT SAFE)
  0 └─────────────────────────────────────────────────────────────► Time (s)
```

1. **Moisture Adsorption Efficacy:**  
   Simulated high-humidity air (80%–88% RH) was drawn through the conditioning path at typical tank-breathing volumetric flow rates (0.5–1.5 L/min). The outlet sensor registered a stabilized **38%–46% RH**, proving an active **net humidity reduction ($\Delta RH$) of 32% to 42% percentage points**.

2. **Optical Phase Separation Trigger Accuracy:**  
   * **Control (Pure E20):** Produced a steady differential signal of **90 to 110 ADC counts** with zero scattering.
   * **Contaminated Sample (E20 + 0.5% Water):** Within 4 minutes of water addition, microscopic emulsion droplets formed followed by liquid stratification. The differential signal **plummeted to 14–22 ADC counts** (an **82% reduction in transmitted intensity**), instantly crossing below the 40 ADC threshold and triggering the **NOT SAFE** visual warning.

3. **Cloud Latency & Remote Synchronization:**  
   Continuous telemetry streaming confirmed edge-to-cloud dispatch and client rendering latencies of **under 1.8 seconds**, providing true near-real-time diagnostic oversight.

---

### 6. Innovation & Competitive Differentiation

| Parameter | Traditional EVAP Canister | Lab Testing (Karl Fischer) | Water Finding Pastes | FuelGuard E20 System |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Function** | Captures fuel vapors | Measures water in ppm | Detects free tank water | **Prevents moisture ingress & detects phase separation** |
| **Real-Time Ability** | None (Passive filter) | No (Hours/Days delay) | No (Manual dipstick) | **Continuous 2.5-second live streaming** |
| **Sensor Placement** | Breather line only | Destructive sampling | Manual insertion | **External non-invasive optical clamp + dual psychrometry** |
| **Liquid Contact** | None | Direct chemical mixing | Submerged in tank | **Zero electronic contact with liquid fuel** |
| **User Alerting** | None | Written lab report | Visual color change | **Smartphone PWA dashboard with remote cloud sync** |
| **Unit Cost** | ₹800–₹1,500 | ₹2,00,000+ (Equipment) | ₹400 (Single-use tube) | **₹580 (Mass production scale)** |

---

### 7. Financial Feasibility & Bill of Materials

#### 7.1 Prototype vs. Mass Production Cost

```
┌───────────────────────────────────────────────┬────────────────────────┬────────────────────────┐
│ Component Description                         │ Prototype Cost (INR)   │ Mass Production (INR)  │
├───────────────────────────────────────────────┼────────────────────────┼────────────────────────┤
│ ESP32-S3 SoC / Microcontroller Module         │ ₹ 450                  │ ₹ 180                  │
│ Dual Digital Humidity Sensors (SHT30 / DHT22) │ ₹ 500                  │ ₹ 140                  │
│ 940 nm NIR Transceiver Pair & Resistors       │ ₹ 150                  │ ₹ 40                   │
│ Injection-Molded Enclosure & Clip Assembly    │ ₹ 350                  │ ₹ 95                   │
│ SMT Printed Circuit Board (PCB) Assembly      │ ₹ 100                  │ ₹ 95                   │
│ Regenerable Desiccant Cartridge (Silica Gel)  │ ₹ 100                  │ ₹ 30                   │
├───────────────────────────────────────────────┼────────────────────────┼────────────────────────┤
│ TOTAL HARDWARE COST                           │ ₹ 1,650 (~$19.80 USD)  │ ₹ 580 (~$7.00 USD)     │
└───────────────────────────────────────────────┴────────────────────────┴────────────────────────┘
```

#### 7.2 Return on Investment (ROI)
* **Cost to Vehicle Owner:** ₹580 unit cost.
* **Avoided Repair Costs:** Draining fuel tank (₹1,500), cleaning injectors (₹3,500), replacing submersible electric fuel pump (₹8,000–₹15,000), cylinder head overhaul (₹25,000+).
* **ROI Ratio:** **Over 25x cost recovery** upon preventing a single contamination incident.

---

### 8. Implementation Roadmap & Scaling Strategy

```
  [ PHASE 1: Months 1–6 ]          [ PHASE 2: Months 6–18 ]         [ PHASE 3: Months 18+ ]
Aftermarket Breather Retrofit   ──► OEM Automotive Integration   ──► Fleet Telematics & Retail
• Commercial Auto-rickshaws        • Integrate into vehicle EVAP     • Centralized fleet portal
• Commuter motorcycles             • CAN-bus cluster alerts          • Smart fuel nozzle testing
• 100-vehicle pilot deployment     • ARAI / AIS certification        • Commercial scale rollout
```

* **Phase 1: Aftermarket Breather Retrofit (Months 1–6):** Target commercial two-wheeler delivery fleets and auto-rickshaws. The unit installs inline into the factory rubber fuel breather hose within 10 minutes using standard hose clamps.
* **Phase 2: OEM Automotive Integration (Months 6–18):** Partner with two-wheeler and passenger vehicle OEMs (Hero MotoCorp, Bajaj, TVS, Tata Motors) to integrate the desiccant cartridge inside the factory EVAP assembly and pipe the optical output to the vehicle's digital dashboard via CAN-bus.
* **Phase 3: B2B Fleet Management & Quality Assurance (Months 18+):** Expand to logistics operators (Zomato, Swiggy, Amazon Logistics) with centralized multi-tank fleet monitoring and partner with Oil Marketing Companies (IOCL, BPCL, HPCL) for nozzle-mounted fuel screening.

---

### 9. Expected Multidimensional Impact

* **Economic Impact:** Saves fleet operators and daily commuters tens of thousands of rupees in preventable engine overhauls, reducing commercial vehicle downtime by up to 12%.
* **Social & Safety Impact:** Eliminates high-speed engine cutoffs on highways and busy intersections caused by sudden phase separation ingestion, enhancing commuter safety.
* **Environmental Impact:** Eliminates public resistance to ethanol blending, supporting national decarbonization targets by enabling vehicles to run safely on high-ethanol renewable blends.

---

### 10. Required Support to Scale

To accelerate commercialization, the team seeks:
1. **Automotive Testing Lab Access:** Partnerships with accredited facilities (ARAI / ICAT) for environmental vibration, thermal shock, and fuel-vapour safety compliance testing.
2. **Mentorship in Automotive Standards:** Regulatory guidance on AIS-024/AIS-028 emissions compliance, EVAP canister integration, and ATEX intrinsically safe electrical standards.
3. **Pilot Partnerships:** Co-development access with commercial fleet operators for a 50-vehicle real-world pilot study across monsoon and coastal conditions.
4. **Seed Capital:** Funding of **₹10,00,000 to ₹15,00,000 (~$12,000–$18,000 USD)** for custom SMT PCB design, automotive-grade polymer tooling, and quartz optical flow-cell fabrication.

---

*FuelGuard E20 Concept Note — Comprehensive System Overview & Commercialization Plan*
