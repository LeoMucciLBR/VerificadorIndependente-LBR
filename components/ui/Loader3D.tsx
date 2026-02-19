"use client";

import { Canvas } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Torus, Environment, OrbitControls, Html } from "@react-three/drei";
import { Suspense } from "react";

function ElegantShape() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
      {/* Torus = Modern Ring Shape - MADE VISIBLE */}
      <Torus args={[1, 0.3, 32, 100]}>
        <MeshTransmissionMaterial
          backside
          backsideThickness={1}
          thickness={0.5}
          roughness={0}
          transmission={0.95} // Not fully transparent
          ior={1.5}
          chromaticAberration={0.1}
          anisotropy={0.1}
          color="#3b82f6" // Blueish Glass
          resolution={1024}
        />
      </Torus>
    </Float>
  );
}

function LoaderFallback() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <p className="text-xs font-mono text-slate-400">Carregando 3D...</p>
            </div>
        </Html>
    )
}

export default function Loader3D() {
  return (
    <div className="w-full h-screen fixed inset-0 z-[9999] bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center">
      <div className="relative w-full h-full max-w-xl max-h-[800px]">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Environment preset="city" />
            {/* Added lights to ensure visibility even if env fail */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            
            <Suspense fallback={<LoaderFallback />}>
              <ElegantShape />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
            </Suspense>
          </Canvas>
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 font-medium animate-pulse">
              Carregando
          </p>
      </div>
    </div>
  );
}
