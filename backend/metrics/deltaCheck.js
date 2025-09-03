import { spawn } from "child_process";

function runPython(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("python", ["eval/metrics.py", ...args], { cwd: process.cwd() });
    let out = "", err = "";
    p.stdout.on("data", d => out += d.toString());
    p.stderr.on("data", d => err += d.toString());
    p.on("close", (code) => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err || `exit ${code}`)));
  });
}

/**
 * Checks whether `currentScore` equals ΔBERTScore or BLEURT for given refs/p0/p1.
 * Returns { isDeltaBERT, isBLEURT, deltaBERT, deltaBLEURT }.
 */
export async function checkOrComputeDeltaMetrics(refs, p0, p1, currentScore) {
  const refsJ = JSON.stringify(refs), p0J = JSON.stringify(p0), p1J = JSON.stringify(p1);

  const bert = await runPython(["--metric","bertscore","--refs",refsJ,"--p0",p0J,"--p1",p1J]);
  let isDeltaBERT = Math.abs((currentScore ?? NaN) - bert.delta) < 1e-6;

  let blt;
  try {
    blt = await runPython(["--metric","bleurt","--refs",refsJ,"--p0",p0J,"--p1",p1J]);
  } catch (_) {
    blt = { delta: null }; // BLEURT optional if TF not installed
  }
  const isBLEURT = blt.delta != null && Math.abs((currentScore ?? NaN) - blt.delta) < 1e-6;

  return { isDeltaBERT, isBLEURT, deltaBERT: bert.delta, deltaBLEURT: blt.delta ?? null };
}
