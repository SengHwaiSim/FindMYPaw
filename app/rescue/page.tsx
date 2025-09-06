"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User } from "@supabase/supabase-js";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

export default function Rescue() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const handleScan = async () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      let selectedDeviceId = videoDevices[0]?.deviceId;
      const mode = facingMode === "user" ? "front" : "back";
      const device = videoDevices.find((d) =>
        d.label.toLowerCase().includes(mode)
      );
      if (device) selectedDeviceId = device.deviceId;
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId! } },
      });
      setStream(newStream);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
    }
  };

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  const handleFlip = async () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
    await handleScan();
  };

  const handleUpload = async () => {
    if (!file) return alert("Pick a file first");
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage
        .from("animal-images")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("animal-images").getPublicUrl(fileName);
      await supabase.from("rescued_animals").insert({ image_url: data.publicUrl });
      alert("Upload successful!");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {stream ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-96 h-72 rounded-lg" />
            <div className="flex gap-4">
              <button onClick={handleStop} className="px-6 py-3 bg-red-500 text-white rounded">Stop</button>
              <button onClick={handleFlip} className="px-6 py-3 bg-green-500 text-white rounded">Flip</button>
            </div>
          </>
        ) : (
          <button onClick={handleScan} className="px-6 py-3 bg-blue-500 text-white rounded">Scan Now</button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={() => inputRef.current?.click()} className="px-6 py-2 bg-blue-500 text-white rounded">
          Choose Picture
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>
        {file && <p className="text-sm">{file.name}</p>}
      </main>
      <BottomNavigation />
    </div>
  );
}
