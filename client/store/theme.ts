// this would override device theme, to be wired in _layout.tsx 
import { create } from "zustand";

type ThemeMode = "system" | "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  setMode: (mode) => set({ mode }),
}));
