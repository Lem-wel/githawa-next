// src/app/api/manager/reschedule/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { appointmentId, appt_date, appt_time, staff_id, room_id } = json;

    if (!appointmentId || !appt_date || !appt_time || !staff_id || !room_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user from cookie/session using client (we're serverless — check supabase session cookie)
    // This reads the `sb` cookie created by supabase-js on client (if used). If you use different auth flows,
    // adjust to verify user token from the Authorization header.
    const cookie = req.headers.get("cookie") ?? "";
    const authRes = await supabaseClient.auth.getUser();
    const user = authRes.data.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized (not logged in)" }, { status: 401 });
    }

    // verify user is manager using the view
    const { data: who, error: whoErr } = await supabaseAdmin
      .from("staff_identity_view")
      .select("position, user_id")
      .eq("user_id", user.id)
      .single();

    if (whoErr || !who) {
      return NextResponse.json({ error: "Profile not found or no identity" }, { status: 403 });
    }

    if (who.position !== "manager") {
      return NextResponse.json({ error: "Forbidden: manager only" }, { status: 403 });
    }

    // perform the update using the admin client (service role)
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        appt_date,
        appt_time,
        staff_id,
        room_id
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, appointment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}