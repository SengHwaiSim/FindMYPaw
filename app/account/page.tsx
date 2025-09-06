"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

export default function Account() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user === null) router.push("/");
      else setUser(data.user);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen bg-white ">
      <TopHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-gray-700">
        {user ? (
          <>
            <p className="mb-2">Username: <strong>{user.user_metadata?.username || "-"}</strong></p>
            <p className="mb-4">Email: <strong>{user.email}</strong></p>
            <button
              onClick={logout}
              className="px-4 py-2 border rounded text-red-500"
            >
              Log out
            </button>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
