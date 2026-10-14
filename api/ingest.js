import { getDb, json } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Use POST' });
  const expected = process.env.DEVICE_TOKEN;
  const supplied = req.headers['x-device-token'];
  if (!expected || !supplied || supplied !== expected) return json(res, 401, { error: 'Unauthorized device' });

  const b = req.body || {};
  const required = ['inletHumidity', 'outletHumidity', 'inletTemperature', 'outletTemperature', 'opticalLedOff', 'opticalLedOn', 'opticalDifference'];
  for (const key of required) {
    if (typeof b[key] !== 'number' || !Number.isFinite(b[key])) return json(res, 400, { error: `Invalid numeric field: ${key}` });
  }
  if (b.inletHumidity < 0 || b.inletHumidity > 100 || b.outletHumidity < 0 || b.outletHumidity > 100) {
    return json(res, 400, { error: 'Humidity must be between 0 and 100 %RH' });
  }

  try {
    const db = getDb();
    const deviceId = process.env.DEVICE_ID || 'fuelguard-001';
    const reading = {
      deviceId,
      inletHumidity: b.inletHumidity,
      outletHumidity: b.outletHumidity,
      inletTemperature: b.inletTemperature,
      outletTemperature: b.outletTemperature,
      humidityDifference: b.inletHumidity - b.outletHumidity,
      opticalLedOff: b.opticalLedOff,
      opticalLedOn: b.opticalLedOn,
      opticalDifference: b.opticalDifference,
      moistureSensorOk: b.moistureSensorOk !== false,
      opticalSensorOk: b.opticalSensorOk !== false,
      firmwareUptimeMs: Number.isFinite(b.firmwareUptimeMs) ? b.firmwareUptimeMs : null,
      receivedAt: new Date().toISOString(),
      createdAt: new Date()
    };
    await db.collection('devices').doc(deviceId).collection('measurements').add(reading);
    await db.collection('devices').doc(deviceId).collection('state').doc('latest').set(reading);
    return json(res, 200, { ok: true, deviceId, receivedAt: reading.receivedAt });
  } catch (e) {
    console.error('ingest failed', e);
    return json(res, 500, { error: 'Could not store reading' });
  }
}
