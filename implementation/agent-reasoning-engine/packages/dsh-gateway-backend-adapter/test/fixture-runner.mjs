const prompt = process.argv.at(-1);
const delay = Number(process.env.ARE_DSH_FIXTURE_DELAY_MS ?? 0);
if (delay > 0) await new Promise((resolveValue) => setTimeout(resolveValue, delay));
if (process.env.ARE_DSH_FIXTURE_FAIL === "1") {
  process.stderr.write("private reasoning must not cross the adapter boundary\n");
  process.exit(1);
}
const outputBytes = Number(process.env.ARE_DSH_FIXTURE_OUTPUT_BYTES ?? 0);
process.stdout.write(outputBytes > 0 ? "x".repeat(outputBytes) : `fixture:${prompt}\n`);
