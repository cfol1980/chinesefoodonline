"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  useEffect(() => {
    const test = async () => {
      try {
        const snapshot = await getDocs(collection(db, "supporters"));
        console.log("Supporters:", snapshot.docs.map(d => d.data()));
      } catch (err) {
        console.error("Firestore error:", err);
      }
    };
    test();
  }, []);

  return <h1>Hello Firebase + Next.js!</h1>;
}
