"use client";

import { useEffect, useLayoutEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface LineInput {
  matchId: string;
  txId: string;
  invoiceId: string;
  confidence: number;
  status: "suggested" | "confirmed" | "flashing";
  isActive: boolean;
}

interface LineCoords extends LineInput {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ConnectionLinesProps {
  containerRef: React.RefObject<HTMLDivElement>;
  leftPanelRef: React.RefObject<HTMLDivElement>;
  rightPanelRef: React.RefObject<HTMLDivElement>;
  lines: LineInput[];
}

function lineColor(confidence: number, status: string): string {
  if (status === "confirmed" || status === "flashing") return "#16a34a";
  if (confidence >= 0.80) return "#16a34a";
  if (confidence >= 0.65) return "#d97706";
  return "#dc2626";
}

export function ConnectionLines({
  containerRef,
  leftPanelRef,
  rightPanelRef,
  lines,
}: ConnectionLinesProps) {
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [coords, setCoords] = useState<LineCoords[]>([]);

  const measure = useCallback(() => {
    const c = containerRef.current;
    const l = leftPanelRef.current;
    const r = rightPanelRef.current;
    if (!c || !l || !r) return;

    const cR = c.getBoundingClientRect();
    const lR = l.getBoundingClientRect();
    const rR = r.getBoundingClientRect();

    setSvgSize({ w: cR.width, h: cR.height });

    const x1 = lR.right - cR.left;
    const x2 = rR.left - cR.left;

    setCoords(
      lines.flatMap((line) => {
        const txEl = document.getElementById(`recon-tx-${line.txId}`);
        const invEl = document.getElementById(`recon-inv-${line.invoiceId}`);
        if (!txEl || !invEl) return [];
        const tR = txEl.getBoundingClientRect();
        const iR = invEl.getBoundingClientRect();
        return [
          {
            ...line,
            x1,
            y1: tR.top - cR.top + tR.height / 2,
            x2,
            y2: iR.top - cR.top + iR.height / 2,
          },
        ];
      }),
    );
  }, [containerRef, leftPanelRef, rightPanelRef, lines]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, measure]);

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 1,
      }}
      width={svgSize.w || "100%"}
      height={svgSize.h || "100%"}
    >
      <defs>
        <style>{`
          @keyframes marchAnts { to { stroke-dashoffset: -26; } }
          @keyframes pulseLine { 0%,100%{opacity:.3} 50%{opacity:.65} }
          @keyframes flashLine { 0%,100%{stroke-width:2.5;opacity:1} 50%{stroke-width:5;opacity:1} }
          .rl-dash {
            stroke-dasharray: 8 5;
            animation: marchAnts .9s linear infinite, pulseLine 2s ease-in-out infinite;
          }
          .rl-dash-active {
            stroke-dasharray: 8 5;
            animation: marchAnts .55s linear infinite;
          }
          .rl-flash { animation: flashLine .3s ease-in-out 3; }
        `}</style>
        <filter id="rl-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <AnimatePresence>
        {coords.map((c) => {
          const midX = (c.x1 + c.x2) / 2;
          const d = `M${c.x1} ${c.y1} C${midX} ${c.y1},${midX} ${c.y2},${c.x2} ${c.y2}`;
          const color = lineColor(c.confidence, c.status);
          const isConfirmed = c.status === "confirmed";
          const isFlashing = c.status === "flashing";
          const cls = isFlashing
            ? "rl-flash"
            : isConfirmed
              ? ""
              : c.isActive
                ? "rl-dash-active"
                : "rl-dash";
          const opacity = isConfirmed ? 0.75 : c.isActive || isFlashing ? 1 : 0.45;

          return (
            <motion.path
              key={c.matchId}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={isFlashing || c.isActive ? 2.5 : isConfirmed ? 2 : 1.5}
              className={cls}
              filter={isFlashing ? "url(#rl-glow)" : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
}
