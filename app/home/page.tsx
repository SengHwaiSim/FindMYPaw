"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User } from "@supabase/supabase-js";
import PWAInstallPrompt from "@/components/custom/PWA-install-prompt";
import TopHeader from "@/components/custom/TopHeader";
import BottomNavigation from "@/components/custom/BottomNavigation";

interface Detection {
  type: string;
  breed: string;
  confidence: number;
}

interface PredictionResult {
  image_base64_png?: string;
  detections: Detection[];
}

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!image) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("file", image);
    fd.append("conf", "0.6");
    fd.append("return_image", "true");

    const res = await fetch("/api/predict", {  // proxy to FastAPI
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/");
      else setUser(data.user);
    });
  }, []);

  const [lostSelected, setLostSelected] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />
      <main className="flex-1 flex flex-col items-center gap-2 p-4">
        <PWAInstallPrompt />

        <div className="w-full flex justify-center bg-orange-300 text-sm p-4 rounded-md gap-15">
          <div className="text-sm text-gray-700">
            <p>Location</p>
            <p>Rescued: --</p>
            <p>Missing: --</p>
          </div>
          <div className="text-sm text-gray-700">
            <p>Overall Missing: --</p>
            <p>Dogs: --</p>
            <p>Cats: --</p>
          </div>
        </div>

        <div className="relative w-full h-8 rounded-full bg-orange-200 shadow-md">
          <div
            className="absolute w-1/2 h-full rounded-full bg-orange-300 transition-all duration-300 shadow-inner"
            style={{ transform: `translateX(${lostSelected ? "0%" : "100%"})` }}
          />
          <button
            className={`absolute w-1/2 h-full rounded-full font-medium ${
              lostSelected ? "text-black font-bold" : "text-gray-700"
            }`}
            onClick={() => setLostSelected(true)}
          >
            Lost
          </button>
          <button
            className={`absolute w-1/2 h-full right-0 rounded-full font-medium ${
              lostSelected ? "text-gray-700" : "text-black font-bold"
            }`}
            onClick={() => setLostSelected(false)}
          >
            Found
          </button>
        </div>

        <div className="bg-green-100 text-center text-black p-6 w-full rounded-xl shadow-md">
          <p className="text-base">Detail about lost dogs</p>
        </div>

        <div className="w-full p-4 bg-orange-50 rounded-lg shadow-md mt-4 text-gray-700">
          <h2 className="text-lg font-bold mb-2">Pet Detector</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="mb-2"
          />
          <button
            onClick={handlePredict}
            disabled={!image || loading}
            className="px-4 py-2 bg-orange-300 rounded font-semibold disabled:opacity-50"
          >
            {loading ? "Detecting..." : "Run Detection"}
          </button>

          {result && (
            <div className="mt-4">
              {result.image_base64_png && (
                <img
                  src={`data:image/png;base64,${result.image_base64_png}`}
                  alt="prediction"
                  className="w-full max-h-96 object-contain rounded border mb-2"
                />
              )}
              <table className="w-full text-sm border">
                <thead className="bg-orange-200">
                  <tr>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Breed</th>
                    <th className="p-2 border">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {result.detections.map((d: Detection, i: number) => (
                    <tr key={i}>
                      <td className="p-2 border">{d.type}</td>
                      <td className="p-2 border">{d.breed}</td>
                      <td className="p-2 border">{d.confidence.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      </main>
      <BottomNavigation />
    </div>
  );
}
