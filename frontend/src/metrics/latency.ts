// Measures time-to-first-token (TFFT) for a streaming fetch
export async function measureTFFT(url: string, init?: RequestInit) {
  const start = performance.now();
  const res = await fetch(url, { ...init });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  let gotFirst = false;
  let firstChunkAt = 0;
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!gotFirst) { firstChunkAt = performance.now(); gotFirst = true; }
    text += decoder.decode(value, { stream: true });
  }
  const tfftMs = Math.round(firstChunkAt - start);
  return { tfftMs, fullText: text };
}
