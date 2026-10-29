import { useEffect, useRef, useState } from "react";

/**
 * Phase 1 only: creates visually plausible mock sensor values.
 * Replace this hook with a real sensor transport in a later phase.
 * These values are not measurements and predictions are not AI results.
 */
export function useDemoSignals(enabled) {
  const [samples, setSamples] = useState(() => Array.from({ length: 64 }, () => 0));
  const [signal, setSignal] = useState({ emgRms: 0.08, emgPeak: 0.21, accel: [0.01, 0.02, 0.98], gyro: [0.1, -0.2, 0.1], activity: "Resting" });
  const [sampleCount, setSampleCount] = useState(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => {
      phaseRef.current += 1;
      const phase = phaseRef.current;
      const active = phase % 36 > 12 && phase % 36 < 20;
      setSamples((old) => {
        const next = Array.from({ length: 4 }, (_, i) => {
          const noise = (Math.random() - 0.5) * 0.18;
          const carrier = Math.sin((phase * 0.48) + i * 0.9) * (active ? 0.82 : 0.14);
          const pulse = active && phase % 4 === 0 ? (Math.random() > 0.5 ? 0.75 : -0.75) : 0;
          return Math.max(-1, Math.min(1, carrier + noise + pulse));
        });
        return [...old.slice(next.length), ...next];
      });
      const base = active ? 0.42 : 0.08;
      setSignal({
        emgRms: Number((base + Math.random() * (active ? 0.2 : 0.04)).toFixed(3)),
        emgPeak: Number((base * 1.8 + Math.random() * (active ? 0.35 : 0.08)).toFixed(3)),
        accel: [Number((Math.random() * 0.12 - 0.06).toFixed(2)), Number((Math.random() * 0.12 - 0.06).toFixed(2)), Number((0.98 + Math.random() * 0.08).toFixed(2))],
        gyro: [Number((Math.random() * 0.8 - 0.4).toFixed(2)), Number((Math.random() * 0.8 - 0.4).toFixed(2)), Number((Math.random() * 0.8 - 0.4).toFixed(2))],
        activity: active ? "Articulation-like activity" : "Resting",
      });
      setSampleCount((n) => n + 4);
    }, 120);
    return () => window.clearInterval(id);
  }, [enabled]);

  return { samples, signal, sampleCount };
}