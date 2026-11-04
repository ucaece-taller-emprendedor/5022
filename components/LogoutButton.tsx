"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn primary"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
