"use client";

import React, { createContext, useContext } from "react";

interface SupporterContextValue {
  supporterId: string | null;
}

const SupporterContext = createContext<SupporterContextValue>({ supporterId: null });

// Provider component
export function SupporterProvider({
  supporterId,
  children,
}: {
  supporterId: string | null;
  children: React.ReactNode;
}) {
  return (
    <SupporterContext.Provider value={{ supporterId }}>
      {children}
    </SupporterContext.Provider>
  );
}

// Custom hook to use supporter context
export function useSupporter() {
  return useContext(SupporterContext);
}
