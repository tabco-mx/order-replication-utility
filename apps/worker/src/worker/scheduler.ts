export function runWorkerLoop({
  runCycle,
}: {
  runCycle: () => Promise<number>;
}): void {
  const loop = async () => {
    const intervalMs = await runCycle();
    setTimeout(loop, intervalMs);
  };

  loop();
}
