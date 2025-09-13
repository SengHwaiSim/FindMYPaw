"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import PWAInstallPrompt from "@/components/custom/PWA-install-prompt";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

// color palette for pie chart
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#34d399", "#60a5fa"];

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    missing: 0,
    found: 0,
    rescued: 0,
    claims: {} as Record<string, number>,
    weeklyData: [] as { week: string; missing: number; found: number; rescued: number }[],
    typeData: [] as { type: string; value: number }[],
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });

  async function fetchStats() {
    const { data: missing } = await supabase
      .from("missing_animals")
      .select("date_missing, type, rescued");
    const { data: found } = await supabase
      .from("found_animals")
      .select("date_found, type, rescued");
    const { data: rescued } = await supabase
      .from("rescued_animals")
      .select("created_at");
    const { data: claims } = await supabase
      .from("claims")
      .select("status");

    // --- Weekly trends ---
    const weeklyCounts: Record<string, { missing: number; found: number; rescued: number }> = {};

    function getWeek(dateStr: string) {
      const d = new Date(dateStr);
      const firstJan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7);
      const month = d.toLocaleString("default", { month: "short" });
      return `W${week}(${month}) ${d.getFullYear()}`;
    }

    // Use date_missing for missing animals
    missing?.forEach((m) => {
      if (!m.date_missing) return;
      const week = getWeek(m.date_missing);
      if (!weeklyCounts[week]) weeklyCounts[week] = { missing: 0, found: 0, rescued: 0 };
      weeklyCounts[week].missing++;
    });

    // Use date_found for found animals
    found?.forEach((f) => {
      if (!f.date_found) return;
      const week = getWeek(f.date_found);
      if (!weeklyCounts[week]) weeklyCounts[week] = { missing: 0, found: 0, rescued: 0 };
      weeklyCounts[week].found++;
    });

    // Keep created_at for rescued (unless you also add a `date_rescued` column later)
    rescued?.forEach((r) => {
      const week = getWeek(r.created_at);
      if (!weeklyCounts[week]) weeklyCounts[week] = { missing: 0, found: 0, rescued: 0 };
      weeklyCounts[week].rescued++;
    });

    // --- Pet type distribution (same logic as before) ---
    const typeCounts: Record<string, number> = {};
    [...(missing || []), ...(found || [])].forEach((a) => {
      if (a.type) typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    setStats({
      missing: missing?.length || 0,
      found: found?.length || 0,
      rescued: rescued?.length || 0,
      claims:
        claims?.reduce(
          (acc: Record<string, number>, c: { status: string }) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
          },
          {}
        ) ?? {},
      weeklyData: Object.entries(weeklyCounts).map(([week, counts]) => ({ week, ...counts })),
      typeData: Object.entries(typeCounts).map(([type, value]) => ({ type, value })),
    });
  }


    fetchStats();
  }, []);

  // Derived values
  const stillMissing = stats.missing - stats.rescued;
  const pendingClaims = stats.claims["pending"] || 0;
  const totalClaims = Object.values(stats.claims).reduce((a, b) => a + b, 0);

// ---------- build claim data for Claimed + Pending only ----------
const claimedCount = stats.claims["accepted"] || 0; // rename accepted → Claimed
const pendingCount = stats.claims["pending"] || 0;

const claimData = [
  { name: "Claimed", value: claimedCount },
  { name: "Pending to Claim", value: pendingCount },
];



  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />
      <main className="flex-col overflow-y-auto p-3 text-gray-700">
        <PWAInstallPrompt />

        {/* Statistic Cards */}
        <div className="flex flex-wrap gap-3">
          <Card className="bg-red-50 border-red-400 flex-1 min-w-[150px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center text-center">
              <p className="text-lg font-bold">Missing Pets</p>
              <p>Total: {stats.missing}</p>
              <p>Still Missing: {stillMissing}</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-400 flex-1 min-w-[150px] flex items-center justify-center ">
            <CardContent className="flex flex-col items-center text-center">
              <p className="text-lg font-bold">Found Pets</p>
              <p>Total: {stats.found}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-400  flex-1 min-w-[150px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center text-center">
              <p className="text-lg font-bold">Rescued</p>
              <p>Total Rescued: {stats.rescued}</p>
              <p>Still Missing: {stillMissing}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-400 flex-1 min-w-[150px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center text-center">
              <p className="text-lg font-bold">Claims</p>
              <p>Total: {totalClaims}</p>
              <p>Pending: {pendingClaims}</p>
            </CardContent>
          </Card>
        </div>



      {/* Claims Bar Chart */}
      <div className="pt-5">
        <h2 className="text-md font-semibold mb-2">Claims by Status</h2>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <BarChart data={claimData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(t) => Math.floor(t).toString()} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" >
                <Cell fill="#8884d8" />   {/* Claimed */}
                <Cell fill="#f59e0b" />   {/* Pending to Claim */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>



        {/* Missing vs Found vs Rescued Over Time */}
        <div className="pt-5">
          <h2 className="text-md font-semibold mb-2">Missing, Found & Rescued Pets by Week</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={stats.weeklyData}>
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(tick) => Math.floor(tick).toString()} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="missing" stroke="#f87171" name="Missing" />
                <Line type="monotone" dataKey="found" stroke="#34d399" name="Found" />
                <Line type="monotone" dataKey="rescued" stroke="#60a5fa" name="Rescued" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pet Type Distribution */}
        <div className="pt-5">
          <h2 className="text-md font-semibold mb-2">Pet Type Distribution</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.typeData}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                        label={({ name, value }) => {
                          if (typeof value !== 'number' || !value) return `${name || ''}: 0 (0%)`;
                          const total = stats.typeData.reduce((sum: number, item) => sum + item.value, 0);
                          const p = total > 0 ? value / total : 0;
                          return `${name || ''}: ${value} (${(p * 100).toFixed(0)}%)`;
                        }}
                >
                  {stats.typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rescue Success Rate Gauge (half-donut, one ring: green+red) */}
        <div className="pt-5">
          <h2 className="text-md font-semibold mb-2">Rescue Success Rate</h2>
          <div className="w-full h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              {(() => {
                const total = Math.max(stats.missing, 0);
                const rescuedCount = Math.min(stats.rescued, total);
                const still = Math.max(total - rescuedCount, 0);
                const pct = total > 0 ? Math.round((rescuedCount / total) * 100) : 0;

                const gaugeData = [
                  { name: "Rescued", value: rescuedCount, fill: "#34d399" }, // green
                  { name: "Still Missing", value: still, fill: "#f87171" },  // red
                ];

                return (
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      dataKey="value"
                      nameKey="name"
                      startAngle={180}
                      endAngle={0}
                      innerRadius="70%"
                      outerRadius="100%"
                      paddingAngle={0}        // no gaps; one continuous half-ring
                      stroke="none"           // cleaner ring
                    >
                      {gaugeData.map((d, i) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />

                    {/* Center labels */}
                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xl font-bold fill-gray-700"
                    >
                      {pct}%
                    </text>
                    <text
                      x="50%"
                      y="75%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-sm fill-gray-600"
                    >
                      {rescuedCount} rescued / {total} missing ({still} still missing)
                    </text>
                  </PieChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>


      </main>
      <BottomNavigation />
    </div>
  );
}
