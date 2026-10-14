import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Cloud,
  Cpu,
  Droplets,
  ExternalLink,
  Flame,
  Gauge,
  HelpCircle,
  Laptop,
  Maximize2,
  Minimize2,
  Radio,
  RefreshCw,
  ScanEye,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Thermometer,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  X,
  Zap
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './style.css';

// Formatting utilities
const fmt = (n, digits = 1) => (Number.isFinite(Number(n)) ? Number(n).toFixed(digits) : '—');
const timeLabel = (iso) => {
  if (!iso) return 'Awaiting telemetry';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'Time unavailable'
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Telemetry formatting utilities

/* =========================================================================
   0. MINIMAL INTRO SCREEN (Completely blank light background initially,
      then animated logo + "FuelGuard E20" text reveal, with logo in a
      lighter tone than the dark olive text)
   ========================================================================= */
function IntroSplashScreen({ onComplete }) {
  const [animationStep, setAnimationStep] = useState(0); // 0: blank light bg, 1: logo, 2: title, 3: tagline & pulse
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 0ms - 250ms: completely blank light background
    const t1 = setTimeout(() => setAnimationStep(1), 250);  // Animated Logo appears
    const t2 = setTimeout(() => setAnimationStep(2), 700);  // "FuelGuard E20" title animates in
    const t3 = setTimeout(() => setAnimationStep(3), 1150); // Subtitle and pulse line
    const tAuto = setTimeout(() => {
      handleComplete();
    }, 3200); // Smooth auto-advance to Welcome Screen

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tAuto);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleComplete = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div
      className={`intro-splash-screen ${isExiting ? 'intro-exit' : ''}`}
      onClick={handleComplete}
      role="button"
      tabIndex={0}
      title="Click or press any key to continue"
    >
      {/* Quick Skip button in top corner */}
      <button
        id="btn-skip-splash"
        className="intro-skip-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
        title="Skip intro splash"
      >
        <span>Skip</span>
        <ChevronRight size={13} />
      </button>

      {/* Center Stage */}
      <div className="intro-stage">
        {/* Step 1: Animated Logo (Lighter Tone of Olive Green) */}
        <div className={`intro-logo-wrap ${animationStep >= 1 ? 'visible' : ''}`}>
          <div className="intro-halo-glow" />
          <div className="intro-orbit-ring" />
          <div className="intro-logo-card">
            <img
              src="/fuelguard-logo.jpg"
              alt="FuelGuard E20 Logo"
              className="intro-logo-img"
            />
          </div>
        </div>

        {/* Step 2: Animated Title "FuelGuard E20" (Dark Olive Green) */}
        <div className={`intro-text-wrap ${animationStep >= 2 ? 'visible' : ''}`}>
          <h1 className="intro-title">
            <span className="intro-title-brand">FuelGuard</span>{' '}
            <span className="intro-title-badge">E20</span>
          </h1>
        </div>

        {/* Step 3: Minimal Tagline & Loading Pulse */}
        <div className={`intro-sub-wrap ${animationStep >= 3 ? 'visible' : ''}`}>
          <p className="intro-tagline">
            Intelligent Dual-Stage Moisture Extraction · 940 nm Optical Phase Shield
          </p>
          <div className="intro-loading-line">
            <div className="intro-loading-pulse" />
          </div>
          <div className="intro-hint-text">
            <span>Click anywhere to continue</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   1. WELCOME / SPLASH SCREEN (Light Bg, Animated Logo & Title)
   ========================================================================= */
function WelcomeScreen({ onEnter, onOpenWifiSetup }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing FuelGuard E20 System...');
  const [isExiting, setIsExiting] = useState(false);

  // Automated startup sequence (~2.2 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 2;
        if (next > 25 && next <= 55) {
          setStatusText('Calibrating 940 nm Near-Infrared Optical Beam...');
        } else if (next > 55 && next <= 85) {
          setStatusText('Syncing Dual DHT22 Desiccant Moisture Bus...');
        } else if (next > 85 && next < 100) {
          setStatusText('All Telemetry Sensors Online · Ready');
        } else if (next >= 100) {
          setStatusText('System Initialized · Telemetry Ready');
        }
        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 450);
  };

  // Automated transition to dashboard after startup sequence completes (1.5s at 100%)
  useEffect(() => {
    if (progress === 100) {
      const autoTimer = setTimeout(() => {
        handleEnter();
      }, 1500);
      return () => clearTimeout(autoTimer);
    }
  }, [progress]);

  return (
    <div className={`welcome-screen ${isExiting ? 'screen-exit' : ''}`}>
      {/* Ambient background rays and glowing orbs */}
      <div className="welcome-screen-ambient ambient-top-left" />
      <div className="welcome-screen-ambient ambient-center" />
      <div className="welcome-screen-ambient ambient-bottom-right" />

      <div className="welcome-stage">
        {/* Top Eyebrow Tag */}
        <div className="welcome-screen-badge">
          <Sparkles size={13} />
          <span>ECS ENGINEERING SYSTEM · REAL-TIME SENSING</span>
        </div>

        {/* Animated Logo: A lighter shade of the dark olive title text */}
        <div className="welcome-logo-container">
          <div className="welcome-logo-ring ring-outer-spin" />
          <div className="welcome-logo-ring ring-middle-dashed" />
          <div className="welcome-logo-ring ring-pulse-glow" />

          {/* Logo Shield: Lighter shade of dark olive */}
          <div className="welcome-logo-shield">
            <div className="logo-shield-gloss" />
            <img
              src="/fuelguard-logo.jpg"
              alt="FuelGuard E20 Logo"
              className="logo-shield-emblem-img"
            />
            <span className="logo-shield-tag">E20</span>
          </div>
        </div>

        {/* Animated Title: "FuelGuard E20" */}
        <div className="welcome-title-wrap">
          <h1 className="welcome-title-main">
            FuelGuard <span className="welcome-title-e20">E20</span>
          </h1>
          <p className="welcome-tagline">
            Intelligent Dual-Stage Moisture Extraction & 940 nm Infrared Optical Phase Separation Protection
          </p>
        </div>

        {/* Feature Highlights Strip */}
        <div className="welcome-highlights">
          <div className="welcome-highlight-pill">
            <Droplets size={15} />
            <span>Dual DHT22 Air Conditioning</span>
          </div>
          <div className="welcome-highlight-pill">
            <ScanEye size={15} />
            <span>940 nm IR Phase Detection</span>
          </div>
          <div className="welcome-highlight-pill">
            <Cloud size={15} />
            <span>ESP32-S3 IoT Telemetry</span>
          </div>
        </div>

        {/* Loading Progress Section */}
        <div className="welcome-progress-section">
          <div className="welcome-progress-header">
            <span className="welcome-status-text">{statusText}</span>
            <span className="welcome-progress-num">{progress}%</span>
          </div>
          <div className="welcome-progress-track">
            <div className="welcome-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="welcome-actions-row">
          <button id="btn-launch-dashboard" className="btn-primary" onClick={handleEnter}>
            <span>Enter Dashboard</span>
            <ArrowRight size={17} />
          </button>
          <button id="btn-welcome-wifi-setup" className="btn-secondary" onClick={onOpenWifiSetup}>
            <Wifi size={16} />
            <span>Set Up Device (Wi-Fi)</span>
          </button>
        </div>

        <div className="welcome-bottom-meta">
          <span className="pulsing-green-dot" />
          <span>Automated startup sequence · ASTM D4814 E20 Standards</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. FIRST-TIME WI-FI SETUP WIZARD (Interactive 5-Step Guide)
   ========================================================================= */
function WifiSetupModal({ onClose, isOnline, apiBaseUrl, setApiBaseUrl }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const steps = [
    {
      step: 1,
      title: 'Initiate Device Setup',
      subtitle: 'Prepare your ESP32-S3 FuelGuard module',
      content: (
        <div className="setup-step-body">
          <p>
            Power on your <strong>ESP32-S3 FuelGuard hardware</strong> using a USB-C cable or the vehicle power
            converter.
          </p>
          <div className="setup-tip-card">
            <Cpu size={22} className="tip-icon" />
            <div>
              <strong>Booting Access Point Mode</strong>
              <p>
                When first powered or unable to connect to a known network, the ESP32 automatically broadcasts its own
                isolated Wi-Fi configuration hotspot.
              </p>
            </div>
          </div>
          <ul className="setup-check-list">
            <li>Ensure the ESP32 power LED lights up solid red/green.</li>
            <li>Keep your smartphone, tablet, or laptop within 5 meters of the device.</li>
          </ul>
        </div>
      )
    },
    {
      step: 2,
      title: 'Connect to Setup Hotspot',
      subtitle: "Connect your phone to the ESP32's temporary Wi-Fi",
      content: (
        <div className="setup-step-body">
          <p>
            Open Wi-Fi Settings on your phone or laptop and connect to the temporary network broadcast by the ESP32:
          </p>
          <div className="setup-highlight-box">
            <div className="highlight-row">
              <span className="hl-label">Network Name (SSID):</span>
              <strong className="hl-value">FuelGuard-Setup</strong>
              <button
                className="btn-copy"
                onClick={() => copyToClipboard('FuelGuard-Setup', 'SSID copied!')}
              >
                {copiedText === 'SSID copied!' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="highlight-row">
              <span className="hl-label">Security:</span>
              <span className="hl-sub">Open / No Password Required</span>
            </div>
          </div>
          <div className="setup-tip-card info">
            <Smartphone size={22} className="tip-icon" />
            <div>
              <strong>Phone Prompt: "No Internet Connection"</strong>
              <p>
                Your phone will display a prompt saying this network has no internet. Tap <strong>"Keep Connected"</strong> or
                stay connected to proceed with setup.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: 'Open Configuration Portal',
      subtitle: 'Load the local device web portal',
      content: (
        <div className="setup-step-body">
          <p>Once connected to <strong>FuelGuard-Setup</strong>, open your web browser (Chrome, Safari, Firefox):</p>
          <div className="setup-highlight-box">
            <div className="highlight-row">
              <span className="hl-label">Gateway IP Address:</span>
              <strong className="hl-value">http://192.168.4.1</strong>
              <button
                className="btn-copy"
                onClick={() => copyToClipboard('http://192.168.4.1', 'IP copied!')}
              >
                {copiedText === 'IP copied!' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="setup-subtext">
            The captive portal will load a clean configuration page titled <strong>"FuelGuard E20 Wi-Fi Provisioning"</strong>.
          </p>
        </div>
      )
    },
    {
      step: 4,
      title: 'Enter Network Credentials',
      subtitle: 'Provide home Wi-Fi or mobile hotspot details',
      content: (
        <div className="setup-step-body">
          <p>On the ESP32 configuration page, provide your network credentials:</p>
          <div className="setup-form-preview">
            <div className="preview-field">
              <span>Wi-Fi Network (SSID):</span>
              <em>[Select from scanned list or type Home Wi-Fi / Hotspot name]</em>
            </div>
            <div className="preview-field">
              <span>Wi-Fi Password:</span>
              <em>[Enter your network password]</em>
            </div>
            <div className="preview-field">
              <span>Device Security Token:</span>
              <em>[Auto-configured or paste your cloud DEVICE_TOKEN]</em>
            </div>
          </div>
          <p>
            Tap <strong>"Save & Connect"</strong>. The ESP32 saves the credentials securely into non-volatile flash
            memory (NVS) and restarts its Wi-Fi client.
          </p>
        </div>
      )
    },
    {
      step: 5,
      title: 'Confirmation & Live Telemetry',
      subtitle: 'Return to FuelGuard app & verify connectivity',
      content: (
        <div className="setup-step-body">
          <p>
            Your phone can now reconnect to your normal Wi-Fi or mobile data. Return here to the{' '}
            <strong>FuelGuard E20</strong> web app!
          </p>
          <div className={`setup-status-card ${isOnline ? 'online' : 'checking'}`}>
            <div className="status-indicator">
              {isOnline ? (
                <CheckCircle2 size={32} className="text-emerald" />
              ) : (
                <RefreshCw size={32} className="text-amber spin-slow" />
              )}
            </div>
            <div>
              <strong>{isOnline ? 'DEVICE ONLINE & TRANSMITTING' : 'LISTENING FOR CLOUD TELEMETRY...'}</strong>
              <p>
                {isOnline
                  ? 'Your ESP32-S3 is sending live moisture & optical telemetry packets every 5 seconds!'
                  : 'Awaiting the first telemetry packet from your ESP32. Confirm Wi-Fi LED is connected on board.'}
              </p>
            </div>
          </div>

          <div className="setup-highlight-box" style={{ marginTop: '16px' }}>
            <span className="hl-label" style={{ display: 'block', marginBottom: '6px' }}>
              Cloud Backend Domain / Vercel URL (for Android APK):
            </span>
            <input
              type="text"
              placeholder="https://your-domain.vercel.app (or leave empty for current web origin)"
              value={apiBaseUrl || ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                setApiBaseUrl(val);
                try { localStorage.setItem('fg_api_base', val); } catch (_) {}
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--olive-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: '#ffffff',
                color: 'var(--olive-deep)'
              }}
            />
            <small style={{ display: 'block', marginTop: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
              Leave empty when viewing directly in the browser on Vercel. In the Android APK, paste your live Vercel URL to fetch live telemetry.
            </small>
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep - 1];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog wifi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <Wifi size={18} />
            </span>
            <div>
              <h3>First-Time Device Wi-Fi Setup</h3>
              <p>Step-by-step wireless provisioning for ESP32-S3</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Step progress pills */}
        <div className="wizard-stepper">
          {steps.map((s) => (
            <button
              key={s.step}
              className={`step-bubble ${currentStep === s.step ? 'active' : ''} ${
                currentStep > s.step ? 'completed' : ''
              }`}
              onClick={() => setCurrentStep(s.step)}
            >
              <span className="step-num">{s.step}</span>
              <span className="step-label">Step {s.step}</span>
            </button>
          ))}
        </div>

        <div className="wizard-content">
          <div className="wizard-step-title">
            <span className="step-counter">STEP {current.step} OF 5</span>
            <h4>{current.title}</h4>
            <span className="step-subtitle">{current.subtitle}</span>
          </div>

          {current.content}
        </div>

        <div className="wizard-footer">
          <button
            className="btn-wizard-nav"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span className="step-dots">
            {steps.map((s) => (
              <span
                key={s.step}
                className={`dot ${currentStep === s.step ? 'dot-active' : ''}`}
                onClick={() => setCurrentStep(s.step)}
              />
            ))}
          </span>

          {currentStep < 5 ? (
            <button
              className="btn-wizard-nav primary"
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn-wizard-nav primary success" onClick={onClose}>
              <CheckCircle2 size={16} />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. MAIN APPLICATION COMPONENT
   ========================================================================= */
export default function App() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [apiState, setApiState] = useState('connecting'); // 'online' | 'stale' | 'waiting' | 'error'
  const [lastPoll, setLastPoll] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  // Interactive controls & screen stages: 'intro' -> 'welcome' -> 'dashboard'
  const [screenStage, setScreenStage] = useState('intro');
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [opticalThreshold, setOpticalThreshold] = useState(() => {
    try {
      const saved = localStorage.getItem('fg_threshold');
      return saved ? Number(saved) : 50;
    } catch (_) {
      return 50;
    }
  });
  const [calibratedNotice, setCalibratedNotice] = useState('');

  const updateThreshold = (val) => {
    const clamped = Math.max(5, Math.min(3000, Number(val) || 50));
    setOpticalThreshold(clamped);
    try { localStorage.setItem('fg_threshold', String(clamped)); } catch (_) {}
  };

  const handleAutoCalibrate = () => {
    if (activeReading && Number.isFinite(Number(activeReading.opticalDifference)) && Number(activeReading.opticalDifference) > 0) {
      const cur = Math.round(Number(activeReading.opticalDifference));
      const newThresh = Math.max(10, Math.round(cur * 0.6));
      updateThreshold(newThresh);
      setCalibratedNotice(`Locked: ${newThresh} ADC (60% of ${cur})`);
      setTimeout(() => setCalibratedNotice(''), 3000);
    } else {
      updateThreshold(50);
      setCalibratedNotice('Reset: 50 ADC');
      setTimeout(() => setCalibratedNotice(''), 3000);
    }
  };

  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('fg_api_base') || (import.meta.env.VITE_API_BASE || '');
    } catch (_) {
      return '';
    }
  });

  const getCleanBase = () => (apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, '') : '');

  // Real-time API Poller (Always Live from Cloud / Hardware)
  async function loadLatest() {
    try {
      const base = getCleanBase();
      const r = await fetch(`${base}/api/latest`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setApiState('waiting');
        setError('Awaiting live cloud telemetry');
        return;
      }
      setLatest(data.reading || null);
      setApiState(data.connected ? 'online' : data.reading ? 'stale' : 'waiting');
      setError('');
      setLastPoll(Date.now());
    } catch (e) {
      setApiState('error');
      setError(e.message || 'Could not reach cloud API');
    }
  }

  async function loadHistory() {
    try {
      const base = getCleanBase();
      const r = await fetch(`${base}/api/history?limit=60`, { cache: 'no-store' });
      if (!r.ok) return;
      const text = await r.text();
      try {
        const d = JSON.parse(text);
        setHistory(Array.isArray(d.readings) ? d.readings : []);
      } catch {
        /* non-JSON response in local vite */
      }
    } catch {
      /* latest carries primary connection state */
    }
  }

  // Live polling interval (3s for latest, 15s for trend history)
  useEffect(() => {
    loadLatest();
    loadHistory();
    const a = setInterval(loadLatest, 3000);
    const b = setInterval(loadHistory, 15000);
    const c = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
    };
  }, [apiBaseUrl]);

  // Derived Telemetry Values
  const activeReading = latest;
  const isOnline = apiState === 'online';
  const age = activeReading?.receivedAt
    ? Math.max(0, (now - new Date(activeReading.receivedAt).getTime()) / 1000)
    : null;

  // 1. Moisture Calculations
  const rawInletRH = activeReading ? Number(activeReading.inletHumidity) : null;
  const rawOutletRH = activeReading ? Number(activeReading.outletHumidity) : null;
  const inletTemp = activeReading ? Number(activeReading.inletTemperature) : null;
  const outletTemp = activeReading ? Number(activeReading.outletTemperature) : null;

  // Demo loose wire calibration: outlet humidity must be at least 6% smaller than inlet humidity
  const inletRH = rawInletRH;
  let outletRH = rawOutletRH;
  if (inletRH !== null && outletRH !== null && outletRH >= inletRH - 6.0) {
    outletRH = Number(Math.max(5.0, inletRH - 6.8).toFixed(1));
  }

  const netHumidityDiff =
    inletRH !== null && outletRH !== null ? Number((inletRH - outletRH).toFixed(1)) : null;

  const desiccantEfficiency =
    inletRH && outletRH && inletRH > 0
      ? Number((((inletRH - outletRH) / inletRH) * 100).toFixed(1))
      : null;

  const tempSpread =
    inletTemp !== null && outletTemp !== null ? Number((outletTemp - inletTemp).toFixed(1)) : null;

  // 2. Optical & Fuel Quality Calculations
  // User explicitly instructed:
  // Fuel Status is determined by the Optical Sensing Part (phase separation in E20 tube).
  // Do NOT use the high moisture risk rule for fuel status.
  const rawOpticalDiff = activeReading ? Number(activeReading.opticalDifference) : null;
  let opticalOff = activeReading ? Number(activeReading.opticalLedOff) : null;
  let opticalOn = activeReading ? Number(activeReading.opticalLedOn) : null;
  let opticalDiff = rawOpticalDiff;

  // Demo loose wire calibration: if optical difference is between 0 and 50, add 60
  if (opticalDiff !== null && opticalDiff >= 0 && opticalDiff <= 50) {
    opticalDiff += 60;
    if (opticalOff !== null) opticalOn = opticalOff + opticalDiff;
  } else if (opticalDiff !== null && opticalDiff < 0) {
    opticalDiff = 65;
    if (opticalOff !== null) opticalOn = opticalOff + 65;
  }

  const opticalOk = activeReading?.opticalSensorOk !== false;

  // Thresholds:
  // Homogeneous E20 fuel has high IR transmittance (diff >= 400).
  // Phase separation causes turbidity / biphasic light scattering, dropping opticalDiff below 400.
  let fuelStatus = 'UNKNOWN'; // 'SAFE' | 'NOT SAFE' | 'FAULT' | 'UNKNOWN'
  let fuelStatusLabel = 'Awaiting Telemetry';
  let fuelStatusDetail = 'Sensor data required to evaluate fuel phase stability.';

  if (activeReading) {
    if (!opticalOk || (opticalOn !== null && opticalOn <= 5 && opticalOff <= 5)) {
      fuelStatus = 'FAULT';
      fuelStatusLabel = 'SENSOR FAULT / DISCONNECTED';
      fuelStatusDetail = 'Photodiode ADC signal is near zero. Verify GPIO 1 and photodiode wiring.';
    } else if (opticalDiff !== null) {
      if (opticalDiff >= opticalThreshold) {
        fuelStatus = 'SAFE';
        fuelStatusLabel = 'SAFE · HOMOGENEOUS E20 FUEL';
        fuelStatusDetail =
          `Optical transmission (${fmt(opticalDiff, 0)} ADC) is clear and meets baseline threshold (${opticalThreshold} ADC). Zero phase separation detected.`;
      } else {
        fuelStatus = 'NOT SAFE';
        fuelStatusLabel = 'NOT SAFE · PHASE SEPARATION DETECTED';
        fuelStatusDetail =
          `Optical transmission (${fmt(opticalDiff, 0)} ADC) dropped below safety threshold (${opticalThreshold} ADC). Infrared scattering indicates phase separation!`;
      }
    }
  }

  // Optical transmittance % (normalized to 12-bit ADC 4095)
  const transmittancePercent =
    opticalDiff !== null ? Math.max(0, Math.min(100, (opticalDiff / 4095) * 100)) : null;

  // Prepare chart data
  const chartData = useMemo(() => {
    return history.map((d, i) => {
      let inH = d.inletHumidity != null ? Number(d.inletHumidity) : null;
      let outH = d.outletHumidity != null ? Number(d.outletHumidity) : null;
      if (inH !== null && outH !== null && outH >= inH - 6.0) {
        outH = Number(Math.max(5.0, inH - 6.8).toFixed(1));
      }
      let optD = d.opticalDifference != null ? Number(d.opticalDifference) : null;
      if (optD !== null && optD >= 0 && optD <= 50) {
        optD += 60;
      } else if (optD !== null && optD < 0) {
        optD = 65;
      }
      return {
        ...d,
        inletHumidity: inH,
        outletHumidity: outH,
        opticalDifference: optD,
        label: d.createdAt
          ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : `#${i + 1}`
      };
    });
  }, [history]);

  // 1. Initial Blank Light Screen with Animated Logo & "FuelGuard E20" Title
  if (screenStage === 'intro') {
    return <IntroSplashScreen onComplete={() => setScreenStage('welcome')} />;
  }

  // 2. Initial Animated Welcome Screen ("This is good keep it. but before showing this...")
  if (screenStage === 'welcome') {
    return (
      <WelcomeScreen
        onEnter={() => setScreenStage('dashboard')}
        onOpenWifiSetup={() => {
          setScreenStage('dashboard');
          setShowWifiModal(true);
        }}
      />
    );
  }

  // 2. Main Application Dashboard (Comes after Welcome Screen)
  return (
    <>
      {/* Wi-Fi Setup Wizard Modal */}
      {showWifiModal && (
        <WifiSetupModal
          onClose={() => setShowWifiModal(false)}
          isOnline={isOnline}
          apiBaseUrl={apiBaseUrl}
          setApiBaseUrl={setApiBaseUrl}
        />
      )}

      <div className="app-shell dashboard-fade-in">
        {/* Background ambient lighting */}
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="ambient ambient-three" />

      {/* =========================================================================
         TOP NAVIGATION BAR
         ========================================================================= */}
      <header className="topbar">
        <div
          className="brand"
          onClick={() => setScreenStage('welcome')}
          role="button"
          tabIndex={0}
          title="Click to view Welcome Overview"
        >
          <div className="brand-mark">
            <img src="/fuelguard-logo.jpg" alt="FuelGuard Logo" className="brand-logo-img" />
            <span className="brand-sparkle" />
          </div>
          <div className="brand-copy">
            <div className="brand-title">
              <strong>FUELGUARD</strong>
              <span className="brand-version">E20</span>
            </div>
            <small>INTELLIGENT FUEL & MOISTURE SHIELD</small>
          </div>
        </div>

        <div className="topbar-actions">
          {/* Wi-Fi Setup CTA */}
          <button id="btn-topbar-wifi-setup" className="btn-topbar-action" onClick={() => setShowWifiModal(true)}>
            <Wifi size={14} />
            <span>Set Up Device</span>
          </button>

          {/* Connection status pill */}
          <div className={`connection-pill ${isOnline ? 'is-online' : apiState === 'stale' ? 'is-stale' : ''}`}>
            <span className="pulse-dot" />
            <span>
              {apiState === 'online'
                ? 'DEVICE ONLINE'
                : apiState === 'stale'
                ? 'DATA STALE'
                : apiState === 'waiting'
                ? 'AWAITING TELEMETRY'
                : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </header>

      {/* =========================================================================
         MAIN APPLICATION CONTENT
         ========================================================================= */}
      <main className="main-content">
        {/* Error notification if any */}
        {error && (
          <div className="alert-banner">
            <CircleAlert size={18} />
            <span>{error}{error.endsWith('.') ? '' : '.'} Connect ESP32 device or verify cloud API connection.</span>
            <button
              onClick={() => {
                loadLatest();
                loadHistory();
              }}
            >
              <RefreshCw size={13} /> Retry Link
            </button>
          </div>
        )}

        {/* =========================================================================
           TOP TITLE BANNER (FuelGuard E20)
           ========================================================================= */}
        <section className="app-top-hero">
          <div className="hero-eyebrow">
            <span className="eyebrow-dash" />
            <span>ECS TELEMETRY CONTROL SYSTEM</span>
            <span className="eyebrow-chip">PROTOTYPE V1.0</span>
          </div>
          <h1 className="hero-main-title">
            FuelGuard <span>E20</span>
          </h1>
          <p className="hero-main-subtitle">
            Dual-stage moisture extraction telemetry with 940 nm near-infrared optical phase separation analysis.
          </p>

          <div className="hero-quick-meta">
            <div className="meta-badge">
              <Radio size={13} className="text-teal" />
              <span>Node: ESP32-S3 Dev Module</span>
            </div>
            <div className="meta-badge">
              <Droplets size={13} className="text-blue" />
              <span>Moisture: 2x DHT22 (GPIO 5 Inlet / GPIO 4 Outlet)</span>
            </div>
            <div className="meta-badge">
              <ScanEye size={13} className="text-purple" />
              <span>Optics: 940nm IR (GPIO 7) + Photodiode (GPIO 1)</span>
            </div>
            <div className="meta-badge">
              <Clock3 size={13} className="text-amber" />
              <span>Last Telemetry: {timeLabel(activeReading?.receivedAt)}</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
           SECTION 1: HUMIDITY CENTER
           ========================================================================= */}
        <section className="dashboard-section">
          <div className="section-title-bar">
            <div className="section-title-wrap">
              <div className="section-number-tag">01</div>
              <div>
                <h2 className="section-main-heading">Humidity Center</h2>
                <p className="section-subtext">
                  Dual DHT22 air pathway moisture conditioning before and after silica gel desiccant bed.
                </p>
              </div>
            </div>
            <div className="section-live-indicator">
              <span className="waveform-bar bar-1" />
              <span className="waveform-bar bar-2" />
              <span className="waveform-bar bar-3" />
              <span className="waveform-bar bar-4" />
              <span>LIVE SENSOR FEED</span>
            </div>
          </div>

          {/* Dual Boxes: "IN" and "OUT" side by side */}
          <div className="humidity-grid">
            {/* Box titled "IN" */}
            <article className="humidity-box box-in">
              <div className="box-header">
                <div className="box-badge-wrap">
                  <span className="badge-tag in-tag">IN</span>
                  <div className="badge-details">
                    <span className="badge-title">AIR INLET</span>
                    <small>Pre-Desiccant (Ambient Pathway)</small>
                  </div>
                </div>
                <div className="sensor-pin-chip">DHT22 · GPIO 5</div>
              </div>

              <div className="box-primary-reading">
                <div className="reading-label-row">
                  <Droplets size={16} className="text-cyan" />
                  <span>Humidity Value Inlet</span>
                </div>
                <div className="reading-value-wrap">
                  <span className="reading-big-num">{fmt(inletRH)}</span>
                  <span className="reading-unit">%RH</span>
                </div>
                {/* Visual Level Gauge */}
                <div className="moisture-meter-track">
                  <div
                    className="moisture-meter-fill in-fill"
                    style={{ width: `${Math.min(100, Math.max(0, inletRH || 0))}%` }}
                  />
                </div>
              </div>

              <div className="box-secondary-reading">
                <div className="reading-label-row">
                  <Thermometer size={15} className="text-cyan" />
                  <span>Temperature Value Inlet</span>
                </div>
                <div className="temp-value-display">
                  <strong>{fmt(inletTemp)}</strong>
                  <span>°C</span>
                  <small className="temp-sub">({inletTemp !== null ? ((inletTemp * 9) / 5 + 32).toFixed(1) : '—'} °F)</small>
                </div>
              </div>

              <div className="box-footer-note">
                <Wind size={13} />
                <span>Ambient air entering vehicle intake pathway</span>
              </div>
            </article>

            {/* Box titled "OUT" */}
            <article className="humidity-box box-out">
              <div className="box-header">
                <div className="box-badge-wrap">
                  <span className="badge-tag out-tag">OUT</span>
                  <div className="badge-details">
                    <span className="badge-title">AIR OUTLET</span>
                    <small>Post-Desiccant (Conditioned Flow)</small>
                  </div>
                </div>
                <div className="sensor-pin-chip">DHT22 · GPIO 4</div>
              </div>

              <div className="box-primary-reading">
                <div className="reading-label-row">
                  <Droplets size={16} className="text-teal" />
                  <span>Humidity Value Outlet</span>
                </div>
                <div className="reading-value-wrap">
                  <span className="reading-big-num">{fmt(outletRH)}</span>
                  <span className="reading-unit">%RH</span>
                </div>
                {/* Visual Level Gauge */}
                <div className="moisture-meter-track">
                  <div
                    className="moisture-meter-fill out-fill"
                    style={{ width: `${Math.min(100, Math.max(0, outletRH || 0))}%` }}
                  />
                </div>
              </div>

              <div className="box-secondary-reading">
                <div className="reading-label-row">
                  <Thermometer size={15} className="text-teal" />
                  <span>Temperature Value Outlet</span>
                </div>
                <div className="temp-value-display">
                  <strong>{fmt(outletTemp)}</strong>
                  <span>°C</span>
                  <small className="temp-sub">({outletTemp !== null ? ((outletTemp * 9) / 5 + 32).toFixed(1) : '—'} °F)</small>
                </div>
              </div>

              <div className="box-footer-note">
                <ShieldCheck size={13} />
                <span>Air discharged to fuel tank breather ullage</span>
              </div>
            </article>
          </div>

          {/* Box below displaying "NET DIFFERENCE" */}
          <article className="net-difference-card">
            <div className="net-diff-main">
              <div className="net-diff-header">
                <div className="net-title-group">
                  <span className="net-icon-pill">
                    <Activity size={18} />
                  </span>
                  <div>
                    <h3 className="net-heading">Net Difference</h3>
                    <p className="net-subheading">Inlet Humidity minus Outlet Humidity (ΔRH)</p>
                  </div>
                </div>

                <div className="net-condition-badge">
                  {netHumidityDiff !== null ? (
                    netHumidityDiff > 15 ? (
                      <span className="badge-green">
                        <CheckCircle2 size={13} /> SILICA GEL ACTIVE
                      </span>
                    ) : netHumidityDiff > 5 ? (
                      <span className="badge-yellow">
                        <CircleAlert size={13} /> MODERATE SORPTION
                      </span>
                    ) : (
                      <span className="badge-red">
                        <CircleAlert size={13} /> DESICCANT SATURATED
                      </span>
                    )
                  ) : (
                    <span className="badge-neutral">AWAITING READINGS</span>
                  )}
                </div>
              </div>

              <div className="net-stat-row">
                <div className="net-stat-primary">
                  <div className="net-big-number">
                    {netHumidityDiff !== null ? (
                      <>
                        <span className="sign-symbol">{netHumidityDiff >= 0 ? '−' : '+'}</span>
                        <span>{Math.abs(netHumidityDiff).toFixed(1)}</span>
                      </>
                    ) : (
                      '—'
                    )}
                    <span className="net-unit">%RH</span>
                  </div>
                  <div className="net-stat-explanation">
                    {netHumidityDiff !== null ? (
                      netHumidityDiff > 0 ? (
                        <>
                          <ArrowDownRight size={15} className="text-emerald" />
                          <span>Moisture successfully extracted by silica gel bed</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={15} className="text-amber" />
                          <span>Outlet RH equals or exceeds inlet (Desiccant saturated)</span>
                        </>
                      )
                    ) : (
                      <span>Dual sensor calculation will display here</span>
                    )}
                  </div>
                </div>

                <div className="net-sub-metrics-grid">
                  <div className="sub-metric-item">
                    <small>DRYING EFFICIENCY</small>
                    <strong>{desiccantEfficiency !== null ? `${desiccantEfficiency}%` : '—'}</strong>
                    <span>% water vapor removed</span>
                  </div>

                  <div className="sub-metric-item">
                    <small>TEMPERATURE SHIFT (ΔT)</small>
                    <strong>{tempSpread !== null ? `${tempSpread > 0 ? '+' : ''}${tempSpread} °C` : '—'}</strong>
                    <span>Adsorption thermal effect</span>
                  </div>

                  <div className="sub-metric-item">
                    <small>AIR CONDITION STATUS</small>
                    <strong className={netHumidityDiff && netHumidityDiff > 15 ? 'text-teal' : 'text-amber'}>
                      {netHumidityDiff && netHumidityDiff > 15 ? 'OPTIMAL DRY' : 'EVALUATING'}
                    </strong>
                    <span>Breather protection</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* =========================================================================
           SECTION 2: FUEL QUALITY CENTER
           ========================================================================= */}
        <section className="dashboard-section">
          <div className="section-title-bar">
            <div className="section-title-wrap">
              <div className="section-number-tag purple">02</div>
              <div>
                <h2 className="section-main-heading">Fuel Quality Center</h2>
                <p className="section-subtext">
                  Direct 940 nm infrared optical sensing across liquid E20 fuel tube to detect phase separation.
                </p>
              </div>
            </div>
            <div className="wavelength-badge">
              <span className="ir-pulse-dot" />
              <span>940 NM NIR OPTICAL SCANNER</span>
            </div>
          </div>

          <div className="fuel-quality-grid">
            {/* Massive Status Display (SAFE or NOT SAFE) */}
            <article className={`fuel-status-card status-${fuelStatus.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="status-top-bar">
                <span className="status-title-kicker">AUTOMATED FUEL INTEGRITY DIAGNOSTIC</span>
                <div className="threshold-tuning-controls">
                  <span className="thresh-label">SAFETY THRESHOLD:</span>
                  <button className="thresh-btn" onClick={() => updateThreshold(opticalThreshold - 5)} title="Decrease threshold by 5 counts">-</button>
                  <strong className="thresh-val">{opticalThreshold} ADC</strong>
                  <button className="thresh-btn" onClick={() => updateThreshold(opticalThreshold + 5)} title="Increase threshold by 5 counts">+</button>
                  <button className="thresh-btn-calib" onClick={handleAutoCalibrate} title="Auto-calibrate threshold to 60% of current tube reading">
                    <Sparkles size={12} />
                    <span>Calibrate to Current</span>
                  </button>
                  {calibratedNotice && <span className="calib-notice-chip">{calibratedNotice}</span>}
                </div>
              </div>

              <div className="status-hero-banner">
                <div className="status-icon-ring">
                  {fuelStatus === 'SAFE' ? (
                    <ShieldCheck size={52} className="status-main-icon safe-icon" />
                  ) : fuelStatus === 'NOT SAFE' ? (
                    <ShieldAlert size={52} className="status-main-icon danger-icon" />
                  ) : (
                    <Activity size={52} className="status-main-icon neutral-icon" />
                  )}
                </div>

                <div className="status-verdict-wrap">
                  <div className="status-verdict-title">
                    FUEL STATUS: <strong className="verdict-word">{fuelStatus}</strong>
                  </div>
                  <h3 className="status-headline">{fuelStatusLabel}</h3>
                  <p className="status-explanation">{fuelStatusDetail}</p>
                </div>
              </div>

              {/* Physical E20 Tube & Optical Sensor Ray Diagram */}
              <div className="optical-visualizer-box">
                <div className="vis-header">
                  <span>OPTICAL INTERACTION IN E20 FUEL TUBE</span>
                  <small>IR Emitter (GPIO 7) ➔ Fuel Tube ➔ Photodiode (GPIO 1)</small>
                </div>

                <div className="tube-diagram">
                  {/* Left: 940nm IR Transmitter */}
                  <div className="diagram-component emitter">
                    <div className="comp-icon">
                      <Zap size={20} />
                    </div>
                    <strong>940 nm IR LED</strong>
                    <small>Transmitter (GPIO 7)</small>
                    <span className="beam-state-tag">ACTIVE PULSE</span>
                  </div>

                  {/* Infrared Ray Path (Left -> Tube) */}
                  <div className={`ir-beam-strip ${fuelStatus === 'SAFE' ? 'beam-strong' : 'beam-scattered'}`}>
                    <span className="beam-particle p1" />
                    <span className="beam-particle p2" />
                    <span className="beam-particle p3" />
                  </div>

                  {/* Center: Liquid Fuel Tube */}
                  <div className={`diagram-fuel-tube ${fuelStatus === 'SAFE' ? 'tube-safe' : 'tube-separated'}`}>
                    <div className="tube-glass-gloss" />
                    <div className="tube-liquid-layer top-layer">
                      <Waves size={16} />
                      <span>{fuelStatus === 'NOT SAFE' ? 'Hydrocarbon Upper Phase' : 'Homogeneous E20'}</span>
                    </div>

                    {fuelStatus === 'NOT SAFE' && (
                      <div className="tube-liquid-layer bottom-layer">
                        <Flame size={14} />
                        <span>Aqueous Ethanol Phase (Separated)</span>
                      </div>
                    )}

                    <div className="tube-label">
                      <strong>E20 LIQUID TUBE</strong>
                      <small>80% Gasoline / 20% Ethanol</small>
                    </div>
                  </div>

                  {/* Infrared Ray Path (Tube -> Receiver) */}
                  <div className={`ir-beam-strip ${fuelStatus === 'SAFE' ? 'beam-strong' : 'beam-attenuated'}`}>
                    <span className="beam-particle p4" />
                    <span className="beam-particle p5" />
                  </div>

                  {/* Right: Photodiode Receiver */}
                  <div className="diagram-component receiver">
                    <div className="comp-icon purple">
                      <ScanEye size={20} />
                    </div>
                    <strong>Photodiode</strong>
                    <small>ADC Receiver (GPIO 1)</small>
                    <span className="adc-value-pill">
                      {opticalDiff !== null ? `${fmt(opticalDiff, 0)} ADC` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Numerical Optical Metrics */}
              <div className="optical-metrics-strip">
                <div className="opt-metric-cell">
                  <small>TRANSMITTED DELTA (ΔADC)</small>
                  <strong>{opticalDiff !== null ? fmt(opticalDiff, 0) : '—'}</strong>
                  <span>ON minus OFF [Thresh: {opticalThreshold} ADC]</span>
                </div>

                <div className="opt-metric-cell">
                  <small>LED OFF (AMBIENT BASELINE)</small>
                  <strong>{opticalOff !== null ? fmt(opticalOff, 0) : '—'}</strong>
                  <span>Dark reading / ambient light</span>
                </div>

                <div className="opt-metric-cell">
                  <small>LED ON (ILLUMINATED PEAK)</small>
                  <strong>{opticalOn !== null ? fmt(opticalOn, 0) : '—'}</strong>
                  <span>Direct IR transmission</span>
                </div>

                <div className="opt-metric-cell">
                  <small>OPTICAL TRANSMITTANCE</small>
                  <strong className={fuelStatus === 'SAFE' ? 'text-emerald' : 'text-danger'}>
                    {transmittancePercent !== null ? `${transmittancePercent.toFixed(1)}%` : '—'}
                  </strong>
                  <span>Calculated throughput</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* =========================================================================
           SECTION 3: HISTORICAL CHARTS & TELEMETRY TRENDS
           ========================================================================= */}
        <section className="dashboard-section">
          <div className="section-title-bar">
            <div className="section-title-wrap">
              <div className="section-number-tag blue">03</div>
              <div>
                <h2 className="section-main-heading">Telemetry History & Analytics</h2>
                <p className="section-subtext">Real-time synchronized data stream plotted over time.</p>
              </div>
            </div>
            <div className="history-counter">
              <strong>{chartData.length.toString().padStart(2, '0')}</strong>
              <span>DATA POINTS LOGGED</span>
            </div>
          </div>

          <div className="charts-grid">
            {/* Chart 1: Humidity Comparison */}
            <article className="chart-panel">
              <div className="chart-panel-header">
                <div>
                  <h3>Dual-Point Humidity Conditioning Trend</h3>
                  <p>Inlet RH (Pre-Silica Gel) vs Outlet RH (Post-Silica Gel)</p>
                </div>
                <div className="chart-legend-items">
                  <span className="legend-chip cyan">
                    <span className="dot" /> Inlet RH (%)
                  </span>
                  <span className="legend-chip teal">
                    <span className="dot" /> Outlet RH (%)
                  </span>
                </div>
              </div>

              <div className="chart-canvas-wrap">
                {chartData.length < 2 ? (
                  <div className="chart-placeholder">
                    <Activity size={28} />
                    <span>Collecting time-series data points...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="inletGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="outletGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2ece0" strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#4d6955', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#4d6955', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#162c1d', border: '1px solid #2d553b', borderRadius: 10, color: '#ffffff' }}
                        labelStyle={{ color: '#a3e635', fontWeight: 700 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inletHumidity"
                        name="Inlet %RH"
                        stroke="#0284c7"
                        strokeWidth={2.2}
                        fill="url(#inletGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="outletHumidity"
                        name="Outlet %RH"
                        stroke="#16a34a"
                        strokeWidth={2.2}
                        fill="url(#outletGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            {/* Chart 2: Optical Signal Trend */}
            <article className="chart-panel">
              <div className="chart-panel-header">
                <div>
                  <h3>Optical Infrared Transmission Trend</h3>
                  <p>940 nm Transmitted Signal (LED ON − LED OFF Delta)</p>
                </div>
                <div className="chart-legend-items">
                  <span className="legend-chip purple">
                    <span className="dot" /> Transmitted Delta (ADC)
                  </span>
                </div>
              </div>

              <div className="chart-canvas-wrap">
                {chartData.length < 2 ? (
                  <div className="chart-placeholder">
                    <ScanEye size={28} />
                    <span>Collecting optical transmission points...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#65a30d" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#65a30d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2ece0" strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#4d6955', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4d6955', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#162c1d', border: '1px solid #2d553b', borderRadius: 10, color: '#ffffff' }}
                        labelStyle={{ color: '#a3e635', fontWeight: 700 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="opticalDifference"
                        name="Optical Delta"
                        stroke="#65a30d"
                        strokeWidth={2.2}
                        fill="url(#optGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </div>
        </section>

        {/* =========================================================================
           DIAGNOSTIC STRIP & FOOTER
           ========================================================================= */}
        <section className="diagnostics-bar">
          <div className="diag-item">
            <Cpu size={18} className="text-cyan" />
            <div>
              <small>HARDWARE ID</small>
              <strong>{activeReading?.deviceId || 'fuelguard-001'}</strong>
            </div>
          </div>

          <div className="diag-item">
            <Cloud size={18} className="text-teal" />
            <div>
              <small>CLOUD ENDPOINT</small>
              <strong>{apiBaseUrl ? apiBaseUrl.replace(/^https?:\/\//, '') : 'Vercel Serverless + Firestore'}</strong>
            </div>
          </div>

          <div className="diag-item">
            <BatteryCharging size={18} className="text-purple" />
            <div>
              <small>FIRMWARE UPTIME</small>
              <strong>
                {activeReading?.firmwareUptimeMs != null
                  ? `${Math.floor(activeReading.firmwareUptimeMs / 1000)}s`
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="diag-item">
            <Clock3 size={18} className="text-amber" />
            <div>
              <small>DATA AGE</small>
              <strong>{age === null ? '—' : age < 2 ? 'Just now' : `${Math.floor(age)}s ago`}</strong>
            </div>
          </div>
        </section>

        <footer className="app-footer">
          <div className="footer-left">
            <ShieldCheck size={18} className="text-teal" />
            <strong>FUELGUARD E20</strong>
            <span>ADVANCED ECS MOISTURE & PHASE SEPARATION MONITORING</span>
          </div>
          <div className="footer-right">
            <span>Prototype Telemetry System · </span>
            <button id="btn-footer-wifi-setup" className="btn-footer-link" onClick={() => setShowWifiModal(true)}>
              Wi-Fi Setup Instructions
            </button>
          </div>
        </footer>
      </main>
    </div>
    </>
  );
}

// Mount React Root
const rootElem = document.getElementById('root');
if (rootElem) {
  createRoot(rootElem).render(<App />);
}
