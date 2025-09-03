// Attach on any streaming endpoint to log time to first byte
export default function tfftMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  let firstWriteAt = null;

  const originalWrite = res.write.bind(res);
  res.write = (...args) => {
    if (!firstWriteAt) firstWriteAt = process.hrtime.bigint();
    return originalWrite(...args);
  };

  res.on("finish", () => {
    if (firstWriteAt) {
      const ns = Number(firstWriteAt - start);
      const tfftMs = Math.round(ns / 1e6);
      console.log(`[TFFT] ${req.path} -> ${tfftMs} ms`);
    }
  });
  next();
}
