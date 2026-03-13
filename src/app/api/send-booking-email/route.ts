import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const {
      to,
      customerName,
      serviceName,
      addonNames,
      apptDate,
      apptTime,
      durationMinutes,
      staffName,
      roomName,
      totalPrice,
      couponCode,
      couponReward,
      paymentMethod,
    } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: "Missing recipient email." },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: "Email server is not configured." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const addonsText =
      Array.isArray(addonNames) && addonNames.length > 0
        ? addonNames.join(", ")
        : "None";

    const couponText = couponCode
      ? `
Coupon Code: ${couponCode}
Coupon Reward: ${couponReward || "N/A"}
`
      : "Coupon Code: None\n";

    const text = `Hello ${customerName || "Customer"},

Your appointment at Ginhawa has been confirmed.

Service: ${serviceName}
Add-ons: ${addonsText}
Date: ${apptDate}
Time: ${apptTime}
Duration: ${durationMinutes} minutes
Staff: ${staffName || "Not assigned"}
Room: ${roomName || "Not assigned"}
Total: ₱${Number(totalPrice || 0).toFixed(2)}
Payment Method: ${paymentMethod || "Cash"}

${couponText}

Thank you for booking with Ginhawa.
`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2f3a33;">
        <h2>Appointment Confirmed</h2>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Your appointment at <b>Ginhawa</b> has been confirmed.</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 620px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Service</b></td><td style="padding: 8px; border: 1px solid #ddd;">${serviceName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Add-ons</b></td><td style="padding: 8px; border: 1px solid #ddd;">${addonsText}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Date</b></td><td style="padding: 8px; border: 1px solid #ddd;">${apptDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Time</b></td><td style="padding: 8px; border: 1px solid #ddd;">${apptTime}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Duration</b></td><td style="padding: 8px; border: 1px solid #ddd;">${durationMinutes} minutes</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Staff</b></td><td style="padding: 8px; border: 1px solid #ddd;">${staffName || "Not assigned"}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Room</b></td><td style="padding: 8px; border: 1px solid #ddd;">${roomName || "Not assigned"}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Total</b></td><td style="padding: 8px; border: 1px solid #ddd;">₱${Number(totalPrice || 0).toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Payment Method</b></td><td style="padding: 8px; border: 1px solid #ddd;">${paymentMethod || "Cash"}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Coupon</b></td><td style="padding: 8px; border: 1px solid #ddd;">${couponCode || "None"}</td></tr>
          ${
            couponCode
              ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Coupon Reward</b></td><td style="padding: 8px; border: 1px solid #ddd;">${couponReward || "N/A"}</td></tr>`
              : ""
          }
        </table>

        <p style="margin-top: 16px;">Thank you for booking with Ginhawa.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Ginhawa" <${gmailUser}>`,
      to,
      subject: "Your Ginhawa appointment is confirmed",
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("send-booking-email error:", error);
    return NextResponse.json(
      { error: "Failed to send booking email." },
      { status: 500 }
    );
  }
}