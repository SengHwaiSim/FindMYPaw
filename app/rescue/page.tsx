"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

export default function Rescue() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);

  // form fields
  const [dateMissing, setDateMissing] = useState("");
  const [location, setLocation] = useState("");
  const [breed, setBreed] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });
  }, []);

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a picture");
    if (!dateMissing || !location || !type) {
      return alert("Please fill in all required fields (date, location, type)");
    }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;

    try {
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("animal-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("animal-images")
        .getPublicUrl(fileName);

      // Insert record into database
      const { error: dbError } = await supabase.from("missing_animals").insert({
        user_id: user?.id,
        image_url: data.publicUrl,
        date_missing: dateMissing,
        location,
        breed,
        type,
        color,
        remark,
      });

      if (dbError) throw dbError;

      alert("Report submitted successfully!");
      setFile(null);
      setDateMissing("");
      setLocation("");
      setBreed("");
      setType("");
      setColor("");
      setRemark("");
      setOpenPanel(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <button
          onClick={() => setOpenPanel(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow"
        >
          Report Missing
        </button>
      </main>

      {/* Slide-up Modal */}
      {openPanel && (
        <div className="fixed inset-0 flex items-end justify-center bg-black text-gray-700 z-50" style={{backgroundColor: 'rgba(0,0,0,0.4)'}}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg animate-slide-up">
            <h2 className="text-lg font-bold mb-4 text-center">
              Report Missing Animal
            </h2>

            {/* File upload */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="mb-2"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && <p className="text-sm text-gray-600">File: {file.name}</p>}

            {/* Required Fields */}
            <input
              type="date"
              value={dateMissing}
              onChange={(e) => setDateMissing(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Location *"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Type (Dog, Cat, etc.) *"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
              required
            />

            {/* Optional Fields */}
            <input
              type="text"
              placeholder="Breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
            />
            <textarea
              placeholder="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full mb-2 border p-2 rounded"
            />

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setOpenPanel(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
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
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
