import { getDb, json } from './_firebase.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Use GET' });
  try {
    const db = getDb();
    const id = process.env.DEVICE_ID || 'fuelguard-001';
    const rawLimit = Number.parseInt(req.query?.limit || '60', 10);
    const limit = Math.min(120, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 60));
    const snap = await db.collection('devices').doc(id).collection('measurements').orderBy('createdAt', 'desc').limit(limit).get();
    const readings = snap.docs.map(doc => {
      const d = doc.data();
      return { ...d, createdAt: d.createdAt?.toDate?.().toISOString?.() || d.receivedAt || null };
    }).reverse();
    return json(res, 200, { readings });
  } catch (e) {
    console.error('history failed', e);
    return json(res, 500, { error: 'Could not read history' });
  }
}
