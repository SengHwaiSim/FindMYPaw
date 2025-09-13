"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";
import imageCompression from "browser-image-compression";

interface AnimalReport {
  id: string;
  user_id: string;
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
  rescued?: boolean;
}

export default function Rescue() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openPanel, setOpenPanel] = useState<"missing" | "found" | "scan" | null>(null);

  // form fields
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [breed, setBreed] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [remark, setRemark] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const malaysiaStates = [
    "Johor","Kedah","Kelantan","Melaka","Negeri Sembilan",
    "Pahang","Perak","Perlis","Pulau Pinang","Sabah",
    "Sarawak","Selangor","Terengganu",
    "WP Kuala Lumpur","WP Labuan","WP Putrajaya",
  ];

  const ageOptions = [
    "1–3 months","4–6 months","7–9 months","10–12 months",
    ...Array.from({ length: 40 }, (_, i) => `${i + 1} year old`),
    "Don't know",
  ];

  // helpers
  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    const today = new Date();
    const d = new Date(dateStr);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "<1 day ago";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // state
  const [confirmReport, setConfirmReport] = useState<AnimalReport | null>(null);
  const [allReports, setAllReports] = useState<AnimalReport[]>([]);
  const [filter, setFilter] = useState<"all" | "missing" | "found" | "rescued">("all");
  const [step, setStep] = useState<1 | 3>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [claimingReport, setClaimingReport] = useState<AnimalReport | null>(null);
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimPreview, setClaimPreview] = useState<string | null>(null);
  const [claimRemark, setClaimRemark] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [openReportMenu, setOpenReportMenu] = useState(false);
    const [scanResults, setScanResults] = useState<AnimalReport[]>([]);
    const [showScanResults, setShowScanResults] = useState(false);



  // compress image before saving
  const handleFileChange = async (f: File | null) => {
    if (!f) return;
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 640,
        useWebWorker: true,
      };
      const compressed = await imageCompression(f, options);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Image compression failed:", err);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleAIDetect = async () => {
    if (!file) return alert("Please upload a picture first");
    setDetecting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("AI detection failed");
      const data = await res.json();

      if (data.detections?.length > 0) {
        const best = data.detections[0];
        setType(best.type || "");
        setBreed(best.breed || "");
      } else {
        alert("No animal detected. Please enter manually.");
      }
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Error while detecting animal.");
      setStep(3);
    } finally {
      setDetecting(false);
    }
  };

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
      ...(missingData?.map((m) => ({ ...m, source: "missing"})) || []),
      ...(foundData?.map((f) => ({ ...f, source: "found"})) || []),
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
      const { error: uploadError } = await supabase.storage.from("animal-images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("animal-images").getPublicUrl(fileName);
      const table = openPanel === "missing" ? "missing_animals" : "found_animals";

      const insertData =
        openPanel === "missing"
          ? { user_id: user?.id, image_url: data.publicUrl, date_missing: date, location, breed, type, color, gender, age, remark }
          : { user_id: user?.id, image_url: data.publicUrl, date_found: date, location, breed, type, color, gender, age, remark };

      const { error: dbError } = await supabase.from(table).insert(insertData);
      if (dbError) throw dbError;

      alert("Report submitted successfully!");
      setFile(null); setDate(""); setLocation(""); setBreed(""); setType("");
      setColor(""); setGender(""); setAge(""); setRemark(""); setOpenPanel(null); setStep(1);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    } finally {
      setUploading(false);
    }
  };

  // Filtered reports
  const filteredReports =
  filter === "all"
    ? allReports.filter((r) => !r.rescued) // show all except rescued
    : filter === "rescued"
    ? allReports.filter((r) => r.rescued) // show only rescued pets
    : allReports.filter((r) => r.source === filter && !r.rescued);

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 overflow-y-auto px-4 gap-6 py-4 text-gray-700 ">
        {/* Make Report Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setOpenReportMenu(true)}
            className="px-6 py-3 w-full bg-yellow-400 text-gray-900 rounded-lg shadow font-bold"
          >
            Make A Report
          </button>
        </div>



        {/* Reports List */}
        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-extrabold text-center">Pet Reports</h2>

            {/* Filter Tabs */}
            <div className="flex justify-center gap-1 mt-1">
              {["all", "missing", "found", "rescued"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab as "all" | "missing" | "found" | "rescued")}
                  className={`px-4 py-2 rounded-4xl font-medium ${
                    filter === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tab === "all"
                    ? "All"
                    : tab === "missing"
                    ? "Missing"
                    : tab === "found"
                    ? "Found"
                    : "Rescued"}
                </button>
              ))}
            </div>


          {filteredReports.length === 0 ? (
            <p className="text-gray-600 flex justify-center align-middle">No reports yet.</p>
          ) : (
            filteredReports.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-lg shadow border ${
              r.rescued
                ? "bg-green-100 border-green-500" // ✅ rescued pets in green
                : r.source === "missing"
                ? "bg-red-50 border-red-500"
                : "bg-orange-50 border-orange-300"
            }`}
          >
            {r.image_url && (
              <img
                src={r.image_url}
                alt="Animal"
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-gray-800">
                {getDaysAgo(r.source === "missing" ? r.date_missing : r.date_found)},{" "}
              </span>
              <span className="text-xs text-gray-500">
                {r.source === "missing" ? r.date_missing : r.date_found}
              </span>
            </div>

            <p className="text-sm text-gray-700">
              <strong>{r.source === "missing" ? "Missing" : "Found"}</strong> •{" "}
              {r.type} • {r.location} • {r.gender || "Unknown"} • {r.age || "Unknown"}
            </p>
            {r.remark && (
              <p className="text-sm text-gray-700">
                <strong>Remark:</strong> {r.remark}
              </p>
            )}

            <button
              onClick={() => {
                if (r.user_id !== user?.id && !r.rescued) setConfirmReport(r);
              }}
              disabled={r.user_id === user?.id || r.rescued}
              className={`mt-3 w-full px-3 py-2 rounded-lg font-semibold ${
                r.user_id === user?.id || r.rescued
                  ? "bg-red-300 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-700"
              }`}
            >
              {r.user_id === user?.id
                ? "This is your report"
                : r.rescued
                ? "Already rescued"
                : r.source === "missing"
                ? "I found it!"
                : "It's my pet!"}
            </button>

          </div>


            ))
          )}
        </div>
      </main>

      {openPanel && (
  <div
    className="fixed inset-0 flex items-end justify-center bg-black text-gray-700 z-50"
    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
  >
    <div className="relative w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up">
      {/* ❌ Close Button */}
      <button
        onClick={() => {
          setOpenPanel(null);
          setStep(1);
        }}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl font-bold"
      >
        ×
      </button>

      <h2 className="text-lg font-bold mb-4 text-center">
        {openPanel === "missing"
          ? "Report Missing Animal"
          : openPanel === "found"
          ? "Report Found Animal"
          : "Scan Animal Through Database"}
      </h2>


      {/* Step 1 */}
      {step === 1 && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="mb-2"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded mb-3"
            />
          )}
          <p className="text-xs text-gray-600 mb-3">
            If you do not know which breed is the pet you can do this. <br />
            <span className="font-semibold">AI Detect</span> might take a few seconds or longer, and it is not always correct.
          </p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setStep(3)}
              disabled={!file || detecting}
              className="flex-1 px-4 py-2 bg-orange-400 text-white rounded disabled:opacity-50 font-bold"
            >
              Manual
            </button>
            <button
              onClick={handleAIDetect}
              disabled={!file || detecting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 font-bold"
            >
              {detecting ? "Detecting..." : "AI Detect"}
            </button>
          </div>
          {detecting && (
            <p className="mt-3 text-sm text-blue-600 text-center">
              AI is analyzing the photo, please wait...
            </p>
          )}
        </div>
      )}

      {/* Step 3: limited fields for SCAN */}
      {step === 3 && openPanel === "scan" && (
        <div>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded mb-3" />
          )}

          {/* Type (required) */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
            required
          >
            <option value="">Select Type *</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
          </select>

          {/* Location (required) */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
            required
          >
            <option value="">Select Location *</option>
            {malaysiaStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          {/* Breed (optional) */}
          <input
            type="text"
            placeholder="Breed (optional)"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          />

          {/* Gender (optional) */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          >
            <option value="">Select Gender (optional)</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Don't know">Don&apos;t know</option>
          </select>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => { setOpenPanel(null); setStep(1); }}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!type || !location) return alert("Please select Type and Location.");

                try {
                  // Fetch both missing and found
                  const { data: missingData } = await supabase.from("missing_animals").select("*");
                  const { data: foundData } = await supabase.from("found_animals").select("*");

                  const merged: AnimalReport[] = [
                    ...(missingData?.map((m) => ({ ...m, source: "missing" })) || []),
                    ...(foundData?.map((f) => ({ ...f, source: "found" })) || []),
                  ];

                  // ✅ filter out rescued reports first
                  const notRescued = merged.filter((r) => !r.rescued);

                  // Then check at least 2 fields match
                  const results = notRescued.filter((r) => {
                    let matches = 0;
                    if (r.type?.toLowerCase() === type.toLowerCase()) matches++;
                    if (r.location?.toLowerCase() === location.toLowerCase()) matches++;
                    if (breed && r.breed?.toLowerCase() === breed.toLowerCase()) matches++;
                    if (gender && r.gender?.toLowerCase() === gender.toLowerCase()) matches++;
                    return matches >= 2;
                  });

                  setScanResults(results);
                  setShowScanResults(true);
                  setOpenPanel(null);
                  setStep(1);

                } catch (err) {
                  console.error(err);
                  alert("Error while scanning database.");
                }
              }}

              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Submit Scan
            </button>
          </div>
        </div>
      )}

      {/* Step 3: FULL form for MISSING/FOUND (your existing block unchanged) */}
      {step === 3 && (openPanel === "missing" || openPanel === "found") && (
        <div>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded mb-3" />
          )}

          {/* Type + Breed */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
            required
          >
            <option value="">Select Type *</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
          </select>
          <input
            type="text"
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          />

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
            required
          />

          {/* Location */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
            required
          >
            <option value="">
              {openPanel === "missing" ? "Select Missing Location *" : "Select Found Location *"}
            </option>
            {malaysiaStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          {/* Gender */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Don't know">Don&apos;t know</option>
          </select>

          {/* Age */}
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          >
            <option value="">Select Age</option>
            {ageOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Optional */}
          <input
            type="text"
            placeholder="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          />
          <textarea
            placeholder={openPanel === "missing" ? "Remark" : "Condition / Remark"}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full mb-2 border p-2 rounded"
          />

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => { setOpenPanel(null); setStep(1); }}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {uploading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

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
                setConfirmReport(null);
                setClaimingReport(confirmReport); // 👈 open claim flow
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      )}

      {claimingReport && (
  <div className="fixed inset-0 flex items-end justify-center bg-black z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
    <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up text-gray-700 relative">
      {/* Close button */}
      <button
        onClick={() => {
          setClaimingReport(null);
          setClaimFile(null);
          setClaimRemark("");
          setClaimPreview(null);
        }}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl font-bold"
      >
        ×
      </button>

      <h2 className="text-lg font-bold mb-4 text-center">
        Submit Confirmation for {claimingReport.type}
      </h2>

      {/* Upload file */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          setClaimFile(f);
          if (f) setClaimPreview(URL.createObjectURL(f));
        }}
        className="mb-2"
        required
      />
      {claimPreview && (
        <img src={claimPreview} alt="Preview" className="w-full h-48 object-cover rounded mb-3" />
      )}

      {/* Remark */}
      <textarea
        placeholder="Write a remark"
        value={claimRemark}
        onChange={(e) => setClaimRemark(e.target.value)}
        className="w-full mb-2 border p-2 rounded"
        required
      />

      <div className="flex justify-between gap-4 mt-4">
        <button
          onClick={() => setClaimingReport(null)}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded"
        >
          Cancel
        </button>
        <button
        onClick={async () => {
          if (!claimFile) return alert("Please upload a confirmation picture.");
          if (!claimRemark.trim()) return alert("Please enter a remark.");
          
          setSubmittingClaim(true);
          try {
            const ext = claimFile.name.split(".").pop();
            const fileName = `${user?.id}/claim_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("claim-images")
              .upload(fileName, claimFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
              .from("claim-images")
              .getPublicUrl(fileName);

            // Save claim record
            // Save claim record
            const { error: dbError } = await supabase.from("claims").insert({
              claimer_id: user?.id,
              image_url: data.publicUrl,
              remark: claimRemark,
              report_type: claimingReport.source,   // "missing" | "found"
              missing_id: claimingReport.source === "missing" ? claimingReport.id : null,
              found_id: claimingReport.source === "found" ? claimingReport.id : null,
            });

            if (dbError) throw dbError;

            // Send email
            await fetch("/api/send-claim-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId: claimingReport.id,
                ownerId: claimingReport.user_id,  // ✅ works after Fix 1
                image: data.publicUrl,
                remark: claimRemark,
              }),
            });

            alert("Claim submitted successfully!");
            setClaimingReport(null);
            setClaimFile(null);
            setClaimPreview(null);
            setClaimRemark("");
          } catch (err) {
            console.error(err);
            alert("Failed to submit claim");
          } finally {
            setSubmittingClaim(false);
          }
        }}

          disabled={submittingClaim}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {submittingClaim ? "Submitting..." : "Submit Claim"}
        </button>
      </div>
    </div>
  </div>
      )}

      {/* Report Menu Modal */}
      {openReportMenu && (
        <div
          className="fixed inset-0 flex items-end justify-center bg-black z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up text-gray-700 relative">
            {/* Close button */}
            <button
              onClick={() => setOpenReportMenu(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>

            <h2 className="text-lg font-bold mb-4 text-center">Make a Report</h2>

            {/* Scan Animal */}
            <button
              onClick={() => {
                setOpenReportMenu(false);
                setOpenPanel("scan");
              }}
              className="w-full mb-2 px-4 py-3 bg-yellow-400 text-gray-800 font-bold rounded-lg shadow hover:bg-yellow-500"
            >
              Scan Animal Through Database
            </button>
            <p className="text-xs text-gray-600 mb-4 text-center">
              We recommend everyone to check if the pets are registered in our database before creating a new report.
            </p>

            {/* Report Missing */}
            <button
              onClick={() => {
                setOpenReportMenu(false);
                setOpenPanel("missing");
              }}
              className="w-full mb-2 px-4 py-3 bg-red-400 text-white font-bold rounded-lg shadow hover:bg-red-500"
            >
              Report Missing
            </button>

            {/* Report Found */}
            <button
              onClick={() => {
                setOpenReportMenu(false);
                setOpenPanel("found");
              }}
              className="w-full px-4 py-3 bg-orange-400 text-white font-bold rounded-lg shadow hover:bg-orange-500"
            >
              Report Found
            </button>
          </div>
        </div>
      )}

      {showScanResults && (
      <div className="fixed inset-0 flex items-end justify-center bg-black z-50" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up text-gray-700">
          <h2 className="text-lg font-bold mb-4 text-center">Scan Results</h2>

          {scanResults.length === 0 ? (
            <p className="text-gray-600 text-center">No close matches found.</p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {scanResults.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-lg shadow border ${
                    r.source === "missing"
                      ? "bg-red-50 border-red-500"
                      : "bg-orange-50 border-orange-300"
                  }`}
                >
                  {r.image_url && (
                    <img
                      src={r.image_url}
                      alt="Animal"
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <p className="text-sm text-gray-700">
                    <strong>{r.source === "missing" ? "Missing" : "Found"}</strong> •{" "}
                    {r.type} • {r.location} • {r.gender || "Unknown"} • {r.age || "Unknown"}
                  </p>
                  {r.breed && <p className="text-sm"><strong>Breed:</strong> {r.breed}</p>}
                  {r.remark && <p className="text-sm"><strong>Remark:</strong> {r.remark}</p>}

                  <button
                    onClick={() => {
                      if (r.user_id !== user?.id && !r.rescued) {
                        setShowScanResults(false);
                        setConfirmReport(r);
                      }
                    }}
                    disabled={r.user_id === user?.id || r.rescued}
                    className={`mt-3 w-full px-3 py-2 rounded-lg font-semibold ${
                      r.user_id === user?.id || r.rescued
                        ? "bg-red-300 text-white cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-700"
                    }`}
                  >
                    {r.user_id === user?.id
                      ? "This is your report"
                      : r.rescued
                      ? "Already rescued"
                      : r.source === "missing"
                      ? "I found it!"
                      : "It's my pet!"}
                  </button>

                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowScanResults(false)}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}




      <BottomNavigation />
    </div>
  );
}
