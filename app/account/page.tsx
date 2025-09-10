"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

interface MissingAnimal {
  id: string;
  image_url: string;
  date_missing: string;
  location: string;
  breed?: string;
  type: string;
  color?: string;
  gender?: string;
  age?: string;
  remark?: string;
  created_at?: string;
}

interface FoundAnimal {
  id: string;
  image_url: string;
  date_found: string;
  location: string;
  breed?: string;
  type: string;
  color?: string;
  gender?: string;
  age?: string;
  remark?: string;
  created_at?: string;
}

export default function Account() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [missingReports, setMissingReports] = useState<MissingAnimal[]>([]);
  const [foundReports, setFoundReports] = useState<FoundAnimal[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteImageUrl, setDeleteImageUrl] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"missing" | "found" | null>(null);

  // accordion state
  const [openMissingId, setOpenMissingId] = useState<string | null>(null);
  const [openFoundId, setOpenFoundId] = useState<string | null>(null);

  // new state
  const [activeTab, setActiveTab] = useState<"missing" | "found">("missing");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
        await fetchReports(data.user.id);
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

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    const table = deleteType === "missing" ? "missing_animals" : "found_animals";

    try {
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteId);
      if (dbError) throw dbError;

      if (deleteImageUrl) {
        const path = deleteImageUrl.split("/").pop();
        if (path) {
          await supabase.storage.from("animal-images").remove([path]);
        }
      }

      if (deleteType === "missing") {
        setMissingReports((prev) => prev.filter((r) => r.id !== deleteId));
      } else {
        setFoundReports((prev) => prev.filter((r) => r.id !== deleteId));
      }

      setDeleteId(null);
      setDeleteImageUrl(null);
      setDeleteType(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete report.");
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
      {/* Collapsed header */}
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

      {/* Expanded details */}
      {isOpen && (
        <div className="px-3 pb-3 text-sm text-gray-700">
          <p>
            <strong>{type === "missing" ? "Date Missing:" : "Date Found:"}</strong>{" "}
            {type === "missing"
              ? (r as MissingAnimal).date_missing
              : (r as FoundAnimal).date_found}
          </p>
          <p>
            <strong>Type:</strong> {r.type}
          </p>
          {r.breed && (
            <p>
              <strong>Breed:</strong> {r.breed}
            </p>
          )}
          {r.color && (
            <p>
              <strong>Color:</strong> {r.color}
            </p>
          )}
          {r.gender && (
            <p>
              <strong>Gender:</strong> {r.gender}
            </p>
          )}
          {r.age && (
            <p>
              <strong>Age:</strong> {r.age}
            </p>
          )}
          {r.remark && (
            <p>
              <strong>Remark:</strong> {r.remark}
            </p>
          )}

          {/* Delete button */}
          <button
            onClick={() => {
              setDeleteId(r.id);
              setDeleteImageUrl(r.image_url);
              setDeleteType(type);
            }}
            className="mt-3 w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
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
        <div className="flex justify-center mb-6 fp">
          <button
            onClick={() => setActiveTab("missing")}
            className={`px-4 py-2 rounded-l-lg  ${
              activeTab === "missing"
                ? "bg-orange-300 text-gray-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Missing Report
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`px-4 py-2 rounded-r-lg ${
              activeTab === "found"
                ? "bg-green-300 text-gray-700 "
                : "bg-gray-100 text-gray-600"
            }`}
          >
           Found Report
          </button>
        </div>

        {activeTab === "missing" && (
        <div className="w-full max-w-md mx-auto bg-orange-300 rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4 text-center">My Missing Reports</h2>
          {missingReports.length === 0 ? (
            <p className="text-gray-600 text-center">No missing reports yet.</p>
          ) : (
            <div className="space-y-2">
              {missingReports.map((r) =>
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

      {activeTab === "found" && (
        <div className=" w-full max-w-md mx-auto bg-green-300 rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4 text-center">My Found Reports</h2>
          {foundReports.length === 0 ? (
            <p className="text-gray-600 text-center">No found reports yet.</p>
          ) : (
            <div className="space-y-2">
              {foundReports.map((r) =>
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
                  setDeleteImageUrl(null);
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
