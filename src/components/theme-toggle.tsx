"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const snapshot = () => document.documentElement.dataset.theme === "dark";
const serverSnapshot = () => false;

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const label = dark ? "تغییر به حالت روشن" : "تغییر به حالت تیره";
  function toggle() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("mskin-theme", theme); } catch { /* Keep working without storage. */ }
    window.dispatchEvent(new Event("mskin-theme-change"));
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
    <Sun className="theme-sun" size={19} aria-hidden="true" />
    <Moon className="theme-moon" size={19} aria-hidden="true" />
  </button>;
}
