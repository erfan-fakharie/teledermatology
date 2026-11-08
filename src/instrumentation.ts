export function register() {
  if (process.env.APP_MODE !== "demo") throw new Error("This build requires APP_MODE=demo.");
}
