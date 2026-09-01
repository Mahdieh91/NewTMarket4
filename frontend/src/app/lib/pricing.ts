const COINGECKO_API_URL =
  process.env.NEXT_PUBLIC_COINGECKO_API_URL ??
  "https://api.coingecko.com/api/v3/simple/price";

const DEFAULT_TECH_USDT_RATE = 10;
const FALLBACK_SOL_USDT_RATE = 150;

function parseEnvRate(raw: string | undefined, fallback: number): number {
  if (raw == null) return fallback;
  const value = Number(String(raw).replace(/,/g, "."));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Reference price of the token in USDT, e.g. 1 TECH = 10 USDT.
 * Configured via NEXT_PUBLIC_TECH_USDT_RATE, defaults to 10.
 */
export const TECH_USDT_RATE: number = parseEnvRate(
  process.env.NEXT_PUBLIC_TECH_USDT_RATE,
  DEFAULT_TECH_USDT_RATE,
);

export function ceilDiv(a: bigint, b: bigint): bigint {
  if (b <= 0n) throw new Error("Divisor must be positive");
  return a <= 0n ? 0n : (a + b - 1n) / b;
}

/** Scales a human fiat rate (e.g. 148.52) to integer micro-units (148_520_000). */
export function rateToMicro(rate: number): bigint {
  return BigInt(Math.round(rate * 1_000_000));
}

/**
 * Base units of a native coin a buyer must send so the shop receives the USDT
 * value of `techRaw` TECH, converted through the current native/USDT price.
 *
 *   nativeUnits = ceil( techRaw * (TECH↔USDT rate) * 10^(native-token dec)
 *                       / (native↔USDT rate) )
 *
 * All rates are stored in integer 1e6 micro-units so fractional prices never
 * rely on floating point for the actual payment amount. Token and native
 * decimals may differ (e.g. TECH has 9 decimals, POL/wei uses 18).
 */
export function techRawToNativeUnits(
  techRaw: bigint,
  techUsdtRate: number,
  nativeUsdtRate: number,
  nativeDecimals: number,
  tokenDecimals: number,
): bigint {
  const scale = BigInt(10) ** BigInt(nativeDecimals - tokenDecimals);
  return ceilDiv(
    techRaw * rateToMicro(techUsdtRate) * scale,
    rateToMicro(nativeUsdtRate),
  );
}

/** Convenience: SOL lamports for a 9-decimal TECH token. */
export function techRawToLamports(
  techRaw: bigint,
  techUsdtRate: number,
  solUsdtRate: number,
): bigint {
  return techRawToNativeUnits(techRaw, techUsdtRate, solUsdtRate, 9, 9);
}

type NativeCoinId = "solana";

/**
 * Live native/USDT price from CoinGecko, cached for 60s in the Next.js data
 * cache so the shop page preview and the buy-tokens verification agree.
 * Falls back to the matching NEXT_PUBLIC_*_USDT_RATE when offline.
 */
async function getNativeUsdtRate(
  coin: NativeCoinId,
  envKey: string,
  fallback: number,
): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}?ids=${coin}&vs_currencies=usd`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) },
    );
    if (response.ok) {
      const body = await response.json();
      const price = Number(body?.[coin]?.usd);
      if (Number.isFinite(price) && price > 0) return price;
    }
  } catch (error) {
    console.warn(`Live ${coin}/USDT price unavailable:`, error);
  }

  return parseEnvRate(process.env[envKey], fallback);
}

export async function getSolUsdtRate(): Promise<number> {
  return getNativeUsdtRate("solana", "NEXT_PUBLIC_SOL_USDT_RATE", FALLBACK_SOL_USDT_RATE);
}