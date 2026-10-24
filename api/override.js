import { getDb, json, setMemoryOverride, getMemoryOverride } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = req.query || {};
  const b = req.body || {};
  const rawState = String(q.state || q.status || b.state || b.status || '').toLowerCase().trim();

  let id = process.env.DEVICE_ID || 'fuelguard-001';
  let db = null;
  try {
    db = getDb();
  } catch (_) {
    // Local / fallback mode
  }

  let currentOverride = getMemoryOverride();
  if (db) {
    try {
      const snap = await db.collection('devices').doc(id).collection('state').doc('control').get();
      if (snap.exists && typeof snap.data()?.override !== 'undefined') {
        currentOverride = snap.data().override;
      }
    } catch (_) {}
  }

  // If no parameter provided, return status and quick links
  if (!rawState) {
    const isBrowser = (req.headers['accept'] || '').includes('text/html');
    if (isBrowser) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>FuelGuard E20 · Cloud Remote Control</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f1c13; color: #fff; padding: 24px; text-align: center; }
            h1 { font-size: 22px; margin-bottom: 8px; color: #a3e635; }
            p { color: #a1bca8; font-size: 14px; margin-bottom: 24px; }
            .btn { display: block; width: 100%; max-width: 320px; margin: 12px auto; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
            .btn-unsafe { background: #b91c1c; }
            .btn-safe { background: #15803d; }
            .btn-auto { background: #1e3a27; border: 1px solid #3d6a4c; }
            .status-pill { display: inline-block; padding: 6px 14px; border-radius: 20px; background: rgba(255,255,255,0.1); margin-bottom: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>FuelGuard E20 Cloud Remote</h1>
          <p>Controls phone screens live in real-time</p>
          <div class="status-pill">Current Cloud State: ${currentOverride || 'AUTO (Live Sensors)'}</div>
          <a class="btn btn-unsafe" href="/api/override?state=unsafe">🔴 Trigger Phase Separation (UNSAFE)</a>
          <a class="btn btn-safe" href="/api/override?state=safe">🟢 Restore Clear Fuel (SAFE)</a>
          <a class="btn btn-auto" href="/api/override?state=auto">🔄 Auto / Live Sensors</a>
        </body>
        </html>
      `);
    }
    return json(res, 200, {
      ok: true,
      currentOverride,
      hint: 'Set ?state=unsafe to force NOT SAFE, ?state=safe to force SAFE, ?state=auto to reset'
    });
  }

  let newOverride = currentOverride;
  if (['unsafe', 'notsafe', 'danger', 'bad', 'phase-separation'].includes(rawState)) {
    newOverride = 'NOT SAFE';
  } else if (['safe', 'good', 'clear', 'homogeneous'].includes(rawState)) {
    newOverride = 'SAFE';
  } else if (['auto', 'reset', 'live', 'clear-override', 'none'].includes(rawState)) {
    newOverride = null;
  } else if (rawState === 'toggle') {
    newOverride = currentOverride === 'NOT SAFE' ? 'SAFE' : 'NOT SAFE';
  }

  setMemoryOverride(newOverride);

  if (db) {
    try {
      await db.collection('devices').doc(id).collection('state').doc('control').set({
        override: newOverride,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Firestore save control error', e);
    }
  }

  return json(res, 200, {
    ok: true,
    override: newOverride,
    message: `Cloud state set to: ${newOverride || 'AUTO (Live Sensors)'}. Connected devices will update within 2 seconds.`
  });
}
