"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const token = await user.getIdTokenResult();
      const roles = (token.claims.roles ?? {}) as Record<string, boolean>;
      if (roles["supporter"] || roles["admin"]) {
        setAuthorized(true);
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-6">Checking access…</div>;
  if (!authorized) return null;
  return <>{children}</>;
}
