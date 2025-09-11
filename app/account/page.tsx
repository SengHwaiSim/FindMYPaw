"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

interface ReportBase {
  id: string;
  user_id: string;
  image_url: string;
  type: string;
  location: string;
  breed?: string;
  color?: string;
  gender?: string;
  age?: string;
  remark?: string;
  rescued?: boolean;
  created_at?: string;
}

interface MissingAnimal extends ReportBase {
  date_missing: string;
}

interface FoundAnimal extends ReportBase {
  date_found: string;
}

interface Claim {
  id: string;
  report_id: string;
  claimer_id: string;
  image_url: string;
  remark: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  report_type: "missing" | "found";
}

interface ClaimData {
  id: string;
  claimer_id: string;
  image_url: string;
  remark: string;
  status: string;
  created_at: string;
  missing_id: string | null;
  found_id: string | null;
  missing_owner: string | null;
  found_owner: string | null;
}


export default function Account() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [missingReports, setMissingReports] = useState<MissingAnimal[]>([]);
  const [foundReports, setFoundReports] = useState<FoundAnimal[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "missing" | "found" | "rescued" | "claims"
  >("missing");

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"missing" | "found" | null>(null);

  // Accordion state
  const [openMissingId, setOpenMissingId] = useState<string | null>(null);
  const [openFoundId, setOpenFoundId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
        await fetchReports(data.user.id);
        await fetchClaims(data.user.id);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const fetchReports = async (userId: string) => {
    const { data: missingData } = await supabase
      .from("missing_animals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: foundData } = await supabase
      .from("found_animals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setMissingReports(missingData || []);
    setFoundReports(foundData || []);
  };

const fetchClaims = async (userId: string) => {
  const { data, error } = await supabase
    .from("claim_with_reports")
    .select("*")
    .or(`missing_owner.eq.${userId},found_owner.eq.${userId}`)
    .neq("claimer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch claims error:", error);
    return;
  }

  const formatted: Claim[] =
    data?.map((c: ClaimData) => ({
      id: c.id,
      claimer_id: c.claimer_id,
      image_url: c.image_url,
      remark: c.remark,
      status: c.status as "pending" | "accepted" | "rejected",
      created_at: c.created_at,
      report_type: c.missing_id ? "missing" : "found",
      report_id: (c.missing_id || c.found_id)!,
    })) || [];

  setClaims(formatted);
};



  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    const table = deleteType === "missing" ? "missing_animals" : "found_animals";

    try {
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteId);
      if (dbError) throw dbError;

      if (deleteType === "missing") {
        setMissingReports((prev) => prev.filter((r) => r.id !== deleteId));
      } else {
        setFoundReports((prev) => prev.filter((r) => r.id !== deleteId));
      }

      setDeleteId(null);
      setDeleteType(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete report.");
    }
  };

  const handleClaimDecision = async (
    claim: Claim,
    decision: "accepted" | "rejected"
  ) => {
    try {
      await supabase
        .from("claims")
        .update({ status: decision })
        .eq("id", claim.id);

      if (decision === "accepted") {
        const table =
          claim.report_type === "missing" ? "missing_animals" : "found_animals";
        await supabase.from(table).update({ rescued: true }).eq("id", claim.report_id);
      }

      fetchReports(user!.id);
      fetchClaims(user!.id);
    } catch (err) {
      console.error("Claim decision failed:", err);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getDaysAgo = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString);
    const diffDays = Math.floor(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return "<1 day ago";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const renderReportCard = (
    r: MissingAnimal | FoundAnimal,
    isOpen: boolean,
    toggle: () => void,
    type: "missing" | "found"
  ) => (
    <div
      key={r.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {r.image_url && (
          <img
            src={r.image_url}
            alt="Animal"
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {type === "missing"
              ? getDaysAgo((r as MissingAnimal).date_missing)
              : getDaysAgo((r as FoundAnimal).date_found)}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {r.location} • {r.gender || "?"} • {r.age || "?"}
          </p>
        </div>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 text-sm text-gray-700">
          <p>
            <strong>Type:</strong> {r.type}
          </p>
          {r.breed && <p><strong>Breed:</strong> {r.breed}</p>}
          {r.color && <p><strong>Color:</strong> {r.color}</p>}
          {r.gender && <p><strong>Gender:</strong> {r.gender}</p>}
          {r.age && <p><strong>Age:</strong> {r.age}</p>}
          {r.remark && <p><strong>Remark:</strong> {r.remark}</p>}

          {!r.rescued && (
            <button
              onClick={() => {
                setDeleteId(r.id);
                setDeleteType(type);
              }}
              className="mt-3 w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 overflow-y-auto px-4 py-6 text-gray-700">
        {user && (
          <div className="mb-3 flex items-center justify-between w-full">
            <div className="flex flex-col">
              <p className="mb-1">
                Username: <strong>{user.user_metadata?.username || "-"}</strong>
              </p>
              <p className="mb-2">
                Email: <strong>{user.email}</strong>
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-1 text-lg rounded-lg text-white bg-red-500 hover:bg-red-100 shadow"
            >
              Log out
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          {["missing", "found", "rescued", "claims"].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab as "missing" | "found" | "rescued" | "claims")
              }
              className={`px-4 py-2 ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Missing Reports */}
        {activeTab === "missing" && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">My Missing Reports</h2>
            {missingReports.filter((r) => !r.rescued).length === 0 ? (
              <p className="text-center text-gray-600">No missing reports.</p>
            ) : (
              <div className="space-y-2">
                {missingReports
                  .filter((r) => !r.rescued)
                  .map((r) =>
                    renderReportCard(
                      r,
                      openMissingId === r.id,
                      () => setOpenMissingId(openMissingId === r.id ? null : r.id),
                      "missing"
                    )
                  )}
              </div>
            )}
          </div>
        )}

        {/* Found Reports */}
        {activeTab === "found" && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">My Found Reports</h2>
            {foundReports.filter((r) => !r.rescued).length === 0 ? (
              <p className="text-center text-gray-600">No found reports.</p>
            ) : (
              <div className="space-y-2">
                {foundReports
                  .filter((r) => !r.rescued)
                  .map((r) =>
                    renderReportCard(
                      r,
                      openFoundId === r.id,
                      () => setOpenFoundId(openFoundId === r.id ? null : r.id),
                      "found"
                    )
                  )}
              </div>
            )}
          </div>
        )}

        {/* Rescued */}
        {activeTab === "rescued" && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">Rescued Pets</h2>
            <div className="space-y-2">
              {[...missingReports, ...foundReports]
                .filter((r) => r.rescued)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-green-100 border border-green-400 rounded"
                  >
                    <p><strong>Type:</strong> {r.type}</p>
                    <p><strong>Location:</strong> {r.location}</p>
                    <p>Status: 🟢 Rescued</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Claims */}
        {activeTab === "claims" && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">Claims Pending Review</h2>
            {claims.filter((c) => c.status === "pending").length === 0 ? (
              <p className="text-center text-gray-600">No claims yet.</p>
            ) : (
              claims
                .filter((c) => c.status === "pending")
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-4 border rounded mb-3 bg-yellow-50"
                  >
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt="Proof"
                        className="w-full h-48 object-cover rounded mb-2"
                      />
                    )}
                    <p className="mb-2"><strong>Remark:</strong> {c.remark}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClaimDecision(c, "accepted")}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded"
                      >
                        Claimed ✅
                      </button>
                      <button
                        onClick={() => handleClaimDecision(c, "rejected")}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded"
                      >
                        Not mine ❌
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black z-50 text-gray-700"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg text-center">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove this report? This action cannot be undone.
            </p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteType(null);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-red-700"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
