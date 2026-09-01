import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export const SHOP_STATE_FILE = path.join(DATA_DIR, "shop-state.json");
export const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");

export function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
