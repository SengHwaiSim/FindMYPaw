import { NextRequest, NextResponse } from "next/server";

const YOLO_API = process.env.YOLO_API_URL || "https://yolo-api-cnin.onrender.com/predict";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const res = await fetch(YOLO_API, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
