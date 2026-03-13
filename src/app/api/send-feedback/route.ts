import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { message, rating, userEmail, userId } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer from 1 to 5." }, { status: 400 });
    }

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    const managerEmail = process.env.MANAGER_EMAIL;

    if (!managerEmail) {
      return NextResponse.json({ error: "Manager email is not configured." }, { status: 500 });
    }

    const result = await resend.emails.send({
      from: "Ginhawa Feedback <onboarding@resend.dev>",
      to: managerEmail,
      subject: "New Customer Feedback - Ginhawa Spa",
      html: `
        <h2>New Customer Feedback</h2>
        <p><strong>User Email:</strong> ${userEmail || "N/A"}</p>
        <p><strong>Star Rating:</strong> ${stars} (${rating}/5)</p>
        <p><strong>Feedback:</strong></p>
        <div style="padding:12px;border:1px solid #ddd;border-radius:8px;background:#f9f9f9;">
          ${String(message).replace(/\n/g, "<br/>")}
        </div>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to send email." },
      { status: 500 }
    );
  }
}