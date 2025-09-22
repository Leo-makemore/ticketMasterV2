const KEY = "tmv2:recent";

export type RecentItem = {
  keyword: string;
  location: string;
  category: string;
  radius: string;
  ts: number;
};

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as RecentItem[];
  } catch {
    return [];
  }
}

export function addRecent(item: Omit<RecentItem, "ts">) {
  const list = readRecent();
  const filtered = list.filter(x => !(x.keyword === item.keyword && x.location === item.location && x.category === item.category && x.radius === item.radius));
  const next = [{ ...item, ts: Date.now() }, ...filtered].slice(0, 10);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
}


