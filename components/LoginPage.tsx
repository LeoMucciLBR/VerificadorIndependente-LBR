"use client";

import dynamic from "next/dynamic";
import LoginForm from "@/components/LoginForm";

const HighwayAnimation = dynamic(() => import("@/components/HighwayAnimation"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0f172a]" />,
});

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <HighwayAnimation />
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 pb-40 pointer-events-none">
        <div className="pointer-events-auto">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
