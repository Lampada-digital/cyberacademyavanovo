import React, { createContext, useContext, useEffect, useState } from "react";
import { onChange, type Row } from "./lib/db";
import { currentUser } from "./lib/api";

interface AppCtx {
  user: Row | null;
  rev: number;
  refresh: () => void;
  setUser: (u: Row | null) => void;
}
const Ctx = createContext<AppCtx>({ user: null, rev: 0, refresh: () => {}, setUser: () => {} });
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Row | null>(() => currentUser());
  const [rev, setRev] = useState(0);
  useEffect(() => onChange(() => setRev((r) => r + 1)), []);
  return <Ctx.Provider value={{ user, rev, refresh: () => setRev((r) => r + 1), setUser }}>{children}</Ctx.Provider>;
}

export function navigate(path: string) {
  if (!path.startsWith("#")) path = "#" + path;
  if (location.hash === path) return;
  location.hash = path;
}
