/**
 * Binary Protocol — 40-byte location message encoder/decoder
 * Matches the tracking server wire format exactly.
 */

const LOCATION_MSG_SIZE = 40;

// ─── Types ───────────────────────────────────────────────
export interface LocationUpdate {
  userId: number;    // uint32 numeric id
  lat: number;       // float64
  lng: number;       // float64
  speed: number;     // uint16 km/h
  bearing: number;   // uint16 degrees
  status: number;    // uint8 (0=idle, 1=active, 2=paused, 3=SOS)
  timestamp: number; // uint64 ms epoch
}

export interface WelcomeMessage {
  type: 'welcome';
  userId: string;
  groupId: string;
  groupSize: number;
  timestamp: number;
}

// ─── ID Mapping ──────────────────────────────────────────
/** Convert MongoDB ObjectId → numeric uint32 for the binary protocol. */
export function objectIdToNumericId(objectId: string): number {
  return parseInt(objectId.slice(-8), 16);
}

// ─── Encoder ─────────────────────────────────────────────
export function encodeLocationUpdate(
  userId: number,
  lat: number,
  lng: number,
  speed: number,
  bearing: number,
  status: number
): ArrayBuffer {
  const buffer = new ArrayBuffer(LOCATION_MSG_SIZE);
  const view = new DataView(buffer);

  view.setUint32(0, userId, true);
  view.setFloat64(4, lat, true);
  view.setFloat64(12, lng, true);
  view.setUint16(20, speed, true);
  view.setUint16(22, bearing, true);
  view.setUint8(24, status);

  const now = Date.now();
  view.setUint32(25, now & 0xffffffff, true);
  view.setUint32(29, Math.floor(now / 0x100000000), true);

  return buffer;
}

// ─── Decoder ─────────────────────────────────────────────
export function decodeLocationUpdate(buffer: ArrayBuffer): LocationUpdate {
  if (buffer.byteLength !== LOCATION_MSG_SIZE) {
    throw new Error(`Invalid message size: ${buffer.byteLength}, expected ${LOCATION_MSG_SIZE}`);
  }

  const view = new DataView(buffer);
  const low = view.getUint32(25, true);
  const high = view.getUint32(29, true);

  return {
    userId: view.getUint32(0, true),
    lat: view.getFloat64(4, true),
    lng: view.getFloat64(12, true),
    speed: view.getUint16(20, true),
    bearing: view.getUint16(22, true),
    status: view.getUint8(24),
    timestamp: high * 0x100000000 + low,
  };
}
