"use client";

import { LazyMotion, domMax } from "framer-motion";

// Provider que carrega features do framer-motion sob demanda
// domMax inclui todas as features (layout, drag, etc.) necessárias para os cards 3D
export default function LazyMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
