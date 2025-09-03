// IPQ scoring helper. Supports 1..7 Likert by default, with optional reverse-coded items.
type Scale = "1-7" | "-3..+3";
export type Answers = Record<string, number>;

export interface IpqConfig {
  presenceItems: string[];     // e.g., ["G1", "SP2", "REAL3", ...]
  involvementItems: string[];  // e.g., ["INV1","INV2","INV3","INV4"]
  reversed?: string[];         // item ids that are reverse-scored
  scale?: Scale;               // default "1-7"
}

function mapTo1to7(v: number, scale: Scale) {
  if (scale === "1-7") return v;           // already 1..7
  // "-3..+3" -> 1..7
  return v + 4;                             // -3..+3 -> 1..7 shift
}

export function scoreIPQ(ans: Answers, cfg: IpqConfig) {
  const scale = cfg.scale ?? "1-7";
  const isRev = new Set(cfg.reversed ?? []);
  const value = (id: string) => {
    let v = mapTo1to7(ans[id], scale);
    if (isRev.has(id)) v = 8 - v;          // reverse 1..7
    return v;
  };
  const mean = (ids: string[]) =>
    ids.reduce((s, id) => s + value(id), 0) / Math.max(ids.length, 1);

  const presenceRaw = mean(cfg.presenceItems);
  const involvementRaw = mean(cfg.involvementItems);

  const normalizePct = (x: number) => ((x - 1) / 6) * 100; // 1..7 -> 0..100
  return {
    presence: presenceRaw,
    involvement: involvementRaw,
    presencePct: normalizePct(presenceRaw),
    involvementPct: normalizePct(involvementRaw),
  };
}
