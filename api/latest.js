import { getDb, json, getMemoryOverride } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Use GET' });
  try {
    const db = getDb();
    const id = process.env.DEVICE_ID || 'fuelguard-001';
    
    // Check for cloud demo override
    let override = getMemoryOverride();
    try {
      const ctrlSnap = await db.collection('devices').doc(id).collection('state').doc('control').get();
      if (ctrlSnap.exists) {
        const cData = ctrlSnap.data();
        if (cData && typeof cData.override !== 'undefined') {
          override = cData.override;
        }
      }
    } catch (_) {}

    const snap = await db.collection('devices').doc(id).collection('state').doc('latest').get();
    if (!snap.exists) return json(res, 200, { connected: false, reading: null, override });
    const d = snap.data();
    const receivedAt = d.receivedAt || null;
    const ageSeconds = receivedAt ? Math.max(0, (Date.now() - new Date(receivedAt).getTime()) / 1000) : Infinity;
    return json(res, 200, { connected: ageSeconds < 30, ageSeconds, override, reading: { ...d, createdAt: undefined } });
  } catch (e) {
    console.error('latest failed', e);
    return json(res, 500, { error: 'Could not read latest data' });
  }
}
