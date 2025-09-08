"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

interface AnimalReport {
  id: string;
  image_url: string;
  location: string;
  type: string;
  gender?: string;
  age?: string;
  remark?: string;
  breed?: string;
  color?: string;
  date_missing?: string;
  date_found?: string;
  created_at?: string;
  source: "missing" | "found";
}

export default function Rescue() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openPanel, setOpenPanel] = useState<"missing" | "found" | null>(null);

  // form fields
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [breed, setBreed] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [remark, setRemark] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [allReports, setAllReports] = useState<AnimalReport[]>([]);
  const [filter, setFilter] = useState<"all" | "missing" | "found">("all"); // 👈 NEW

  const malaysiaStates = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah",
    "Sarawak", "Selangor", "Terengganu",
    "WP Kuala Lumpur", "WP Labuan", "WP Putrajaya",
  ];

  const ageOptions = [
    "1–3 months", "4–6 months", "7–9 months", "10–12 months",
    ...Array.from({ length: 40 }, (_, i) => `${i + 1} year old`),
    "Don't know",
  ];

  // helper
const getDaysAgo = (dateStr?: string) => {
  if (!dateStr) return "Unknown";
  const today = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "<1 day ago";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

// new state
const [confirmReport, setConfirmReport] = useState<AnimalReport | null>(null);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });

    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: missingData } = await supabase
      .from("missing_animals")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: foundData } = await supabase
      .from("found_animals")
      .select("*")
      .order("created_at", { ascending: false });

    const merged: AnimalReport[] = [
      ...(missingData?.map((m) => ({ ...m, source: "missing" })) || []),
      ...(foundData?.map((f) => ({ ...f, source: "found" })) || []),
    ];

    merged.sort(
      (a, b) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
    );

    setAllReports(merged);
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a picture");
    if (!date || !location || !type) {
      return alert("Please fill in required fields (date, location, type)");
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("animal-images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("animal-images")
        .getPublicUrl(fileName);

      const table = openPanel === "missing" ? "missing_animals" : "found_animals";

      const insertData =
        openPanel === "missing"
          ? { user_id: user?.id, image_url: data.publicUrl, date_missing: date, location, breed, type, color, gender, age, remark }
          : { user_id: user?.id, image_url: data.publicUrl, date_found: date, location, breed, type, color, gender, age, remark };

      const { error: dbError } = await supabase.from(table).insert(insertData);
      if (dbError) throw dbError;

      alert("Report submitted successfully!");
      setFile(null); setDate(""); setLocation(""); setBreed(""); setType("");
      setColor(""); setGender(""); setAge(""); setRemark(""); setOpenPanel(null);

      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    } finally {
      setUploading(false);
    }
  };


  // Filtered reports
  const filteredReports = filter === "all" ? allReports : allReports.filter((r) => r.source === filter);

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 overflow-y-auto px-4 gap-6 py-4 text-gray-700 ">
        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenPanel("missing")}
            className="px-6 py-3 bg-red-300 text-gray-700 rounded-lg shadow w-full max-w font-bold"
          >
            Report Missing
          </button>
          <button
            onClick={() => setOpenPanel("found")}
            className="px-6 py-3 bg-orange-300 text-gray-700 rounded-lg shadow w-full max-w-sm font-bold"
          >
            Report Found
          </button>
        </div>



        {/* Reports List */}
        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-extrabold text-center">Pet Reports</h2>

            {/* Filter Tabs */}
            <div className="flex ml-21 gap-1 mt-1">
              {["all", "missing", "found"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab as "all" | "missing" | "found")}
                  className={`px-4 py-2 rounded-4xl font-medium ${
                    filter === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "missing" ? "Missing" : "Found"}
                </button>
              ))}
            </div>

          {filteredReports.length === 0 ? (
            <p className="text-gray-600 ">No reports yet.</p>
          ) : (
            filteredReports.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-lg shadow border ${
                  r.source === "missing" ? "bg-red-50 border-red-500" : "bg-orange-50 border-orange-300"
                }`}
                >
                {r.image_url && (
                  <img src={r.image_url} alt="Animal" className="w-full h-48 object-cover rounded mb-3" />
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-gray-800">
                    {getDaysAgo(r.source === "missing" ? r.date_missing : r.date_found)}, </span>
                  <span className="text-xs text-gray-500">
                    {r.source === "missing" ? r.date_missing : r.date_found}
                  </span>
                </div>

                
                <p className="text-sm text-gray-700">
                  <strong>{r.source === "missing" ? "Missing" : "Found"}</strong> • {r.type} • {r.location} • {r.gender || "Unknown"} • {r.age || "Unknown"}
                </p>
                {r.remark && (
                  <p className="text-sm text-gray-700"><strong>Remark:</strong> {r.remark}</p>
                )}

                <button
                  onClick={() => setConfirmReport(r)}
                  className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-700"
                >
                  {r.source === "missing" ? "I found it!" : "It's my pet!"}
                </button>
              </div>

            ))
          )}
        </div>
      </main>

      {/* Slide-up Modal (same as before) */}
      {openPanel && (
        <div className="fixed inset-0 flex items-end justify-center bg-black text-gray-700 z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up">
            <h2 className="text-lg font-bold mb-4 text-center">
              {openPanel === "missing" ? "Report Missing Animal" : "Report Found Animal"}
            </h2>

            {/* File upload */}
            <input ref={inputRef} type="file" accept="image/*" className="mb-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && <p className="text-sm text-gray-600">File: {file.name}</p>}

            {/* Date */}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mb-2 border p-2 rounded" required />

            {/* Location */}
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full mb-2 border p-2 rounded" required>
              <option value="">
                {openPanel === "missing" ? "Select Missing Location *" : "Select Found Location *"}
              </option>
              {malaysiaStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* Type */}
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full mb-2 border p-2 rounded" required>
              <option value="">Select Type *</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>

            {/* Gender */}
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full mb-2 border p-2 rounded">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Don't know">Don't know</option>
            </select>

            {/* Age */}
            <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full mb-2 border p-2 rounded">
              <option value="">Select Age</option>
              {ageOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Optional */}
            <input type="text" placeholder="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} className="w-full mb-2 border p-2 rounded" />
            <input type="text" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full mb-2 border p-2 rounded" />
            <textarea placeholder={openPanel === "missing" ? "Remark" : "Condition / Remark"} value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full mb-2 border p-2 rounded" />

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button onClick={() => setOpenPanel(null)} className="px-4 py-2 bg-red-500 text-white rounded">Cancel</button>
              <button onClick={handleSubmit} disabled={uploading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
                {uploading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReport && (
      <div className="fixed inset-0 flex items-end justify-center bg-black z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up text-gray-700">
          <h2 className="text-lg font-bold mb-4 text-center">
            {confirmReport.source === "missing" ? "Confirm Found Match" : "Confirm Pet Claim"}
          </h2>

          {confirmReport.image_url && (
            <img src={confirmReport.image_url} alt="Animal" className="w-full h-48 object-cover rounded mb-3" />
          )}
          <div className="space-y-1 text-sm">
            <p><strong>Type:</strong> {confirmReport.type}</p>
            <p><strong>Location:</strong> {confirmReport.location}</p>
            <p><strong>Date:</strong> {confirmReport.source === "missing" ? confirmReport.date_missing : confirmReport.date_found}</p>
            {confirmReport.breed && <p><strong>Breed:</strong> {confirmReport.breed}</p>}
            {confirmReport.color && <p><strong>Color:</strong> {confirmReport.color}</p>}
            {confirmReport.gender && <p><strong>Gender:</strong> {confirmReport.gender}</p>}
            {confirmReport.age && <p><strong>Age:</strong> {confirmReport.age}</p>}
            {confirmReport.remark && <p><strong>Remark:</strong> {confirmReport.remark}</p>}
          </div>

          <div className="flex justify-between gap-4 mt-6">
            <button
              onClick={() => setConfirmReport(null)}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // 👇 later you can handle linking, notifications, or chats
                alert("Confirmed!");
                setConfirmReport(null);
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      )}


      <BottomNavigation />
    </div>
  );
}
