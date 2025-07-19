'use client';

import React, { useRef, useState, useEffect } from 'react';
import TopHeader from '@/components/custom/TopHeader';
import BottomNavigation from '@/components/custom/BottomNavigation';

export default function Rescue() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<string>('user');

  useEffect(() => {
    // Set video source when stream changes
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleScan = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      let selectedDeviceId = null;
      if (facingMode === 'user') {
        const frontCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('front')
        );
        selectedDeviceId = frontCamera ? frontCamera.deviceId : videoDevices[0].deviceId;
      } else {
        const backCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back')
        );
        selectedDeviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } },
        audio: false,
      });

      setStream(newStream);
      console.log('Camera access granted', newStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access the camera. Please check permissions and try again.');
    }
  };

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleFlipCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    await handleScan(); // re-scan immediately after flipping
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {stream ? (
          <>
            <p className="text-md text-gray-500">Point the camera to an animal</p>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-96 h-72 rounded-lg object-cover shadow-md"
            />
            <div className="flex gap-4">
              <button
                className="px-6 py-3 bg-red-500 text-white rounded shadow"
                onClick={handleStop}
              >
                Stop
              </button>
              <button
                className="px-6 py-3 bg-green-500 text-white rounded shadow"
                onClick={handleFlipCamera}
              >
                Flip Camera
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-md text-gray-500">Tap to scan for lost animals nearby</p>
            <button
              className="px-6 py-3 bg-blue-500 text-white rounded shadow"
              onClick={handleScan}
            >
              Scan Now
            </button>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
