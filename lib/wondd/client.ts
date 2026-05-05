// lib/wondd/client.ts

const WONDD_BASE = "https://www.wondd.com/member/bot-game.php";
const WONDD_LIST = "https://www.wondd.com/member/bot-game-packlist.php";

const WONDD_USER = process.env.WONDD_USERNAME!;
const WONDD_PASS = process.env.WONDD_PASSWORD!;

// ── Types ─────────────────────────────────────────────────────
export interface WonddPack {
  packcode:       string;
  name:           string;
  point:          number;
  amount:         string;
  discount:       string;
  netpricedealer: string;
}

export interface WonddTopupResponse {
  status:          number;
  errorcode:       string;
  errordetail:     string;
  orderid?:        string;
  amount?:         number;
  discountamount?: number;
  net?:            number;
}

export interface WonddStatusResponse {
  status:            number;
  errorcode:         string;
  errordetail:       string;
  orderid?:          string;
  createdate?:       string;
  gameid?:           string;
  packcode?:         string;
  packname?:         string;
  point?:            number;
  amount?:           number;
  netamount?:        number;
  remark?:           string;
  trascationstatus?: string;
}

// ── Error ─────────────────────────────────────────────────────
export class WonddError extends Error {
  constructor(public code: string, message: string) {
    super(`[WonDD ${code}] ${message}`);
  }
}

const ERROR_MAP: Record<string, string> = {
  E00: "Database Error กรุณาลองใหม่",
  E01: "ไม่พบสมาชิก",
  E02: "ไม่พบ method",
  E03: "เครดิตไม่เพียงพอ",
  E04: "Service code ไม่ถูกต้อง",
  E05: "ระบบเติมเกมปิดอยู่",
  E06: "Order ID ไม่ถูกต้อง",
  E07: "Pack code ไม่ถูกต้อง",
  E08: "Order ID ต้องไม่ว่าง",
  E09: "IP Address ไม่ได้รับอนุญาต",
};

// ── Currency labels ───────────────────────────────────────────
export const CURRENCY_LABEL: Record<string, string> = {
  rov:        "คูปอง",
  freefire:   "เพชร",
  undawn:     "เพชร",
  blackcover: "คริสตัล",
  codmobile:  "CP",
  haikyuu:    "Coins",
  pubgmobile: "UC",
  mlbb:       "เพชร",
  valorant:   "VP",
  heartopia:  "เพชร",
};

// ── packcode prefix → game slug ───────────────────────────────
// ⚠️  log ดู response จริงก่อน แล้วอัพเดท map นี้ให้ครบ
const PACKCODE_PREFIX: Record<string, string> = {
  R: "rov",
  // เพิ่มหลัง log:
  // "FF":  "freefire",
  // "UD":  "undawn",
  // "BC":  "blackcover",
  // "COD": "codmobile",
  // "HK":  "haikyuu",
  // "PB":  "pubgmobile",
  // "ML":  "mlbb",
  // "VL":  "valorant",
  // "HT":  "heartopia",
};

export function detectGame(pack: WonddPack & { servicecode?: string; game?: string }): string {
  if (pack.servicecode) return pack.servicecode;
  if (pack.game)        return pack.game;
  for (const [prefix, game] of Object.entries(PACKCODE_PREFIX)) {
    if (pack.packcode.startsWith(prefix)) return game;
  }
  return "unknown";
}

// game ที่ต้องส่ง serverid รวมกับ playerid
const NEEDS_SERVER = ["mlbb", "pubgmobile", "undawn", "haikyuu"];

export function buildGameId(playerId: string, serverId?: string, game?: string): string {
  if (serverId && game && NEEDS_SERVER.includes(game)) {
    return `${playerId}(${serverId})`;
  }
  return playerId;
}

// ── fetchAllPacks ─────────────────────────────────────────────
export async function fetchAllPacks(): Promise<WonddPack[]> {
  const res = await fetch(WONDD_LIST, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`WonDD list failed: ${res.status}`);
  const raw = await res.text();
  if (process.env.NODE_ENV === "development") {
    console.log("[WonDD] sample:", raw.slice(0, 800));
  }
  return JSON.parse(raw);
}

// ── callWonddTopup ────────────────────────────────────────────
export async function callWonddTopup(params: {
  servicecode: string;
  packcode:    string;
  gameId:      string;
}): Promise<{ wonddOrderId: string; net: number }> {
  const body = new URLSearchParams({
    method:      "topup",
    username:    WONDD_USER,
    password:    WONDD_PASS,
    servicecode: params.servicecode,
    packcode:    params.packcode,
    gameid:      params.gameId,
  });
  const res  = await fetch(WONDD_BASE, { method: "POST", body });
  const data = await res.json() as WonddTopupResponse;
  if (data.errorcode !== "00") {
    throw new WonddError(data.errorcode, ERROR_MAP[data.errorcode] ?? data.errordetail);
  }
  return { wonddOrderId: data.orderid!, net: data.net! };
}

// ── checkWonddStatus ──────────────────────────────────────────
export async function checkWonddStatus(wonddOrderId: string) {
  const body = new URLSearchParams({
    method:   "checkstatus",
    username: WONDD_USER,
    password: WONDD_PASS,
    orderid:  wonddOrderId,
  });
  const res  = await fetch(WONDD_BASE, { method: "POST", body });
  const data = await res.json() as WonddStatusResponse;
  if (data.errorcode !== "00") {
    throw new WonddError(data.errorcode, data.errordetail);
  }
  return data;
}

// ── checkWonddBalance ─────────────────────────────────────────
export async function checkWonddBalance(): Promise<number> {
  const body = new URLSearchParams({
    method:   "balance",
    username: WONDD_USER,
    password: WONDD_PASS,
  });
  const res  = await fetch(WONDD_BASE, { method: "POST", body });
  const data = await res.json() as { errorcode: string; balance?: number };
  if (data.errorcode !== "00") throw new WonddError(data.errorcode, "Balance check failed");
  return data.balance!;
}