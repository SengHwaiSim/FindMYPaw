"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User } from "@supabase/supabase-js";
import PWAInstallPrompt from "@/components/custom/PWA-install-prompt";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });
  }, []);

  const [lostSelected, setLostSelected] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />
      <main className="flex-1 flex flex-col items-center gap-2 p-4">
        <PWAInstallPrompt />

        <div className="w-full flex justify-center bg-orange-300 text-sm p-4 rounded-md gap-15">
          <div className="text-sm text-gray-700">
            <p>Location</p>
            <p>Rescued: --</p>
            <p>Missing: --</p>
          </div>
          <div className="text-sm text-gray-700">
            <p>Overall Missing: --</p>
            <p>Dogs: --</p>
            <p>Cats: --</p>
          </div>
        </div>

        <div className="relative w-full h-8 rounded-full bg-orange-200 shadow-md">
          <div
            className="absolute w-1/2 h-full rounded-full bg-orange-300 transition-all duration-300 shadow-inner"
            style={{ transform: `translateX(${lostSelected ? "0%" : "100%"})` }}
          />
          <button
            className={`absolute w-1/2 h-full rounded-full font-medium ${
              lostSelected ? "text-black font-bold" : "text-gray-700"
            }`}
            onClick={() => setLostSelected(true)}
          >
            Lost
          </button>
          <button
            className={`absolute w-1/2 h-full right-0 rounded-full font-medium ${
              lostSelected ? "text-gray-700" : "text-black font-bold"
            }`}
            onClick={() => setLostSelected(false)}
          >
            Found
          </button>
        </div>

        <div className="bg-green-100 text-center text-black p-6 w-full rounded-xl shadow-md">
          <p className="text-base">Detail about lost dogs</p>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
