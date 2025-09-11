// app/api/send-claim-email/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 needs Service Role key
);

export async function POST(req: Request) {
  try {
    const { ownerId, reportId, image, remark } = await req.json();

    // 1. Fetch owner email from Supabase
    const { data: { user }, error } = await supabase.auth.admin.getUserById(ownerId);
    if (error || !user) throw error || new Error("User not found");

    const ownerEmail = user.email;

    // 2. Setup transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Send email
    await transporter.sendMail({
      from: `"FindMyPaw" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: "Someone responded to your pet report 🐾",
      html: `
        <p>Hello,</p>
        <p>Someone submitted a claim for your report <b>${reportId}</b>.</p>
        <p><b>Remark:</b> ${remark}</p>
        <p><img src="${image}" alt="Claim proof" width="200"/></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
