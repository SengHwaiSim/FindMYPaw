"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import PWAInstallPrompt from "@/components/custom/PWA-install-prompt";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    missing: 0,
    found: 0,
    rescued: 0,
    claims: {} as Record<string, number>,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });

    async function fetchStats() {
      const { data: missing } = await supabase.from("missing_animals").select("*");
      const { data: found } = await supabase.from("found_animals").select("*");
      const { data: rescued } = await supabase.from("rescued_animals").select("*");
      const { data: claims } = await supabase.from("claims").select("status");

      setStats({
        missing: missing?.length || 0,
        found: found?.length || 0,
        rescued: rescued?.length || 0,
        claims:
          claims?.reduce((acc: Record<string, number>, c: { status: string }) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
          }, {}) ?? {},
      });
    }

    fetchStats();
  }, []);

  const claimData = Object.entries(stats.claims).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto text-gray-700">
        <PWAInstallPrompt />

        {/* Statistic Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-lg font-bold">{stats.missing}</p>
              <p>Missing Pets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-lg font-bold">{stats.found}</p>
              <p>Found Pets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-lg font-bold">{stats.rescued}</p>
              <p>Rescued</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-lg font-bold">
                {Object.values(stats.claims).reduce((a, b) => a + b, 0)}
              </p>
              <p>Claims</p>
            </CardContent>
          </Card>
        </div>

        {/* Claims Bar Chart */}
        <div className="w-full h-64">
          <ResponsiveContainer>
            <BarChart data={claimData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
