import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized (missing token)" },
        { status: 401 }
      );
    }

    const { data: userRes, error: userErr } = await supabaseAnon.auth.getUser(token);
    const user = userRes.user;

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized (invalid token)" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { appointmentId, appt_date, appt_time, staff_id, room_id } = body;

    if (!appointmentId || !appt_date || !appt_time || !staff_id || !room_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("role, staff_id")
      .eq("id", user.id)
      .single();

    if (pErr || !prof) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminMode = prof.role === "admin";

    if (!adminMode) {
      if (prof.role !== "staff" || !prof.staff_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: st, error: sErr } = await supabaseAdmin
        .from("staff")
        .select("position")
        .eq("id", prof.staff_id)
        .single();

      if (
        sErr ||
        !st ||
        String(st.position || "").trim().toLowerCase() !== "manager"
      ) {
        return NextResponse.json(
          { error: "Forbidden: manager only" },
          { status: 403 }
        );
      }
    }

    const { data: updated, error: upErr } = await supabaseAdmin
      .from("appointments")
      .update({ appt_date, appt_time, staff_id, room_id })
      .eq("id", appointmentId)
      .select()
      .single();

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}