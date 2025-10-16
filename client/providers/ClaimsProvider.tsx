import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

type ClaimsContextType = { loading: boolean; user: any; claims: any | null };
const ClaimsContext = createContext<ClaimsContextType>({ loading: true, user: null, claims: null });

export const ClaimsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClaimsContextType>({ loading: true, user: null, claims: null });

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (!u) return setState({ loading: false, user: null, claims: null });
      const r = await u.getIdTokenResult(true); // force-refresh to pull latest custom claims
      setState({ loading: false, user: u, claims: r.claims || {} });
    });
  }, []);

  return <ClaimsContext.Provider value={state}>{children}</ClaimsContext.Provider>;
};

export const useClaims = () => useContext(ClaimsContext);