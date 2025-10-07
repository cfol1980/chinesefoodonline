"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Supporter {
  id: string;
  name?: any;
  settings?: any;
}

const SupporterCtx = createContext<Supporter | null>(null);

export const useSupporter = () => useContext(SupporterCtx);

export const SupporterProvider = ({ children }: { children: React.ReactNode }) => {
  const [supporter, setSupporter] = useState<Supporter | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdTokenResult();

      const assigns = (token.claims.supporterAssignments ?? []) as Array<{
        supporterId: string;
        role?: string;
      }>;

      if (assigns.length > 0) {
        const sid = assigns[0].supporterId;
        const snap = await getDoc(doc(db, "supporters", sid));
        if (snap.exists()) setSupporter({ id: sid, ...(snap.data() as any) });
      }
    });
    return () => unsub();
  }, []);

  return <SupporterCtx.Provider value={supporter}>{children}</SupporterCtx.Provider>;
};
