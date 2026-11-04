// Valida las variables de entorno al arrancar el servidor.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
