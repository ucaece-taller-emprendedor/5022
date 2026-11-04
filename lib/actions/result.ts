import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/auth/session";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (error: string): ActionResult => ({ ok: false, error });

/** Convierte errores conocidos (validación, autorización, base) en un resultado para la UI. */
export async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthorizationError) return fail(err.message);
    if (err instanceof ZodError) return fail(err.issues[0]?.message ?? "Datos inválidos");
    if (isNextControlFlow(err)) throw err;
    const code = (err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code;
    if (code === "23505") return fail("Ya existe un registro con esos datos.");
    if (code === "23503") return fail("No se puede completar: hay datos que dependen de este registro.");
    console.error(err);
    return fail("Ocurrió un error inesperado. Probá de nuevo.");
  }
}

// redirect()/notFound() de Next lanzan errores especiales que no hay que tragarse.
function isNextControlFlow(err: unknown) {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

export const formObject = (fd: FormData) => Object.fromEntries(fd.entries());
