"use client";

import { authClient } from "@/lib/auth/client";

/** Si Google no está configurado en el servidor, se muestra deshabilitado: nunca se simula. */
export default function GoogleButton({ enabled, callbackURL }: { enabled: boolean; callbackURL: string }) {
  return (
    <div style={{ margin: "14px 0" }}>
      <button
        type="button"
        className="btn wide"
        disabled={!enabled}
        title={enabled ? undefined : "El acceso con Google todavía no está configurado"}
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}
      >
        Continuar con Google
      </button>
      {!enabled && <p className="mini" style={{ marginTop: 8 }}>El acceso con Google no está disponible todavía. Usá tu correo y contraseña.</p>}
    </div>
  );
}
