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
  remark?: string;
}

export default function Account() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<MissingAnimal[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteImageUrl, setDeleteImageUrl] = useState<string | null>(null);

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
    const { data, error } = await supabase
      .from("missing_animals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      setReports(data || []);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // 1. Delete DB row
      const { error: dbError } = await supabase
        .from("missing_animals")
        .delete()
        .eq("id", deleteId);

      if (dbError) throw dbError;

      // 2. Delete image from storage
      if (deleteImageUrl) {
        const path = deleteImageUrl.split("/").pop(); // extract filename
        if (path) {
          const { error: storageError } = await supabase.storage
            .from("animal-images")
            .remove([path]);
          if (storageError) console.warn("Storage deletion failed:", storageError.message);
        }
      }

      // 3. Update UI
      setReports((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
      setDeleteImageUrl(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete report.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // if (loading) {
  //   return <p className="flex justify-center items-center h-screen">Loading...</p>;
  // }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed header */}
      <TopHeader />

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 text-gray-700">
        {user && (
          <div className="text-center mb-6">
            <p className="mb-1">
              Username: <strong>{user.user_metadata?.username || "-"}</strong>
            </p>
            <p className="mb-4">Email: {user.email}</p>
            <button
              onClick={logout}
              className="px-3 py-1 border rounded text-red-500 hover:bg-red-100"
            >
              Log out
            </button>
          </div>
        )}

        {/* Reports Panel */}
        <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg shadow p-4 ">
          <h2 className="text-lg font-bold mb-4 text-center">My Missing Reports</h2>

          {reports.length === 0 ? (
            <p className="text-gray-600 text-center">No reports yet.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                >
                  {r.image_url && (
                    <img
                      src={r.image_url}
                      alt="Missing animal"
                      className="w-full h-48 object-cover rounded mb-2"
                    />
                  )}
                  <div className="text-sm text-gray-700">
                    <p>
                      <strong>Date Missing:</strong> {r.date_missing}
                    </p>
                    <p>
                      <strong>Location:</strong> {r.location}
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
                    {r.remark && (
                      <p>
                        <strong>Remark:</strong> {r.remark}
                      </p>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => {
                      setDeleteId(r.id);
                      setDeleteImageUrl(r.image_url);
                    }}
                    className="mt-3 w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50 text-gray-700" style={{backgroundColor: 'rgba(0,0,0,0.4)'}}>
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
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed footer */}
      <BottomNavigation />
    </div>
  );
}
