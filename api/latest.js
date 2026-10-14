import { getDb, json } from './_firebase.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Use GET' });
  try {
    const db = getDb();
    const id = process.env.DEVICE_ID || 'fuelguard-001';
    const snap = await db.collection('devices').doc(id).collection('state').doc('latest').get();
    if (!snap.exists) return json(res, 200, { connected: false, reading: null });
    const d = snap.data();
    const receivedAt = d.receivedAt || null;
    const ageSeconds = receivedAt ? Math.max(0, (Date.now() - new Date(receivedAt).getTime()) / 1000) : Infinity;
    return json(res, 200, { connected: ageSeconds < 30, ageSeconds, reading: { ...d, createdAt: undefined } });
  } catch (e) {
    console.error('latest failed', e);
    return json(res, 500, { error: 'Could not read latest data' });
  }
}
