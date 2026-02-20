import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function overlaps(aStart:number, aDur:number, bStart:number, bDur:number) {
  const aEnd = aStart + aDur;
  const bEnd = bStart + bDur;
  return aStart < bEnd && bStart < aEnd;
}

async function awardBadges(userId: string) {
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const count = appts?.length ?? 0;

  // BOOKED_2_TOTAL
  if (count >= 2) {
    const { data: badge } = await supabase.from("badges").select("id").eq("code","BOOKED_2_TOTAL").single();
    if (badge?.id) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: badge.id }, { onConflict: "user_id,badge_id" });
  }

  // BOOKED_2_IN_A_ROW (simple version: 2+ bookings)
  if (count >= 2) {
    const { data: badge } = await supabase.from("badges").select("id").eq("code","BOOKED_2_IN_A_ROW").single();
    if (badge?.id) await supabase.from("user_badges").upsert({ user_id: userId, badge_id: badge.id }, { onConflict: "user_id,badge_id" });
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  // In production you should verify the logged-in user securely.
  // For your thesis demo, we accept user_id from client.
  const { user_id, service_id, appt_date, appt_time, duration_minutes, room_id, staff_id, notes } = body;

  if (!user_id || !service_id || !appt_date || !appt_time || !duration_minutes || !room_id || !staff_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // get existing appointments for same date, same room OR staff
  const { data: existing } = await supabase
    .from("appointments")
    .select("appt_time, duration_minutes")
    .eq("appt_date", appt_date)
    .or(`room_id.eq.${room_id},staff_id.eq.${staff_id}`);

  const newStart = toMinutes(appt_time);
  const newDur = Number(duration_minutes);

  for (const e of existing ?? []) {
    const oldStart = toMinutes(String(e.appt_time).slice(0,5));
    const oldDur = Number(e.duration_minutes);
    if (overlaps(newStart, newDur, oldStart, oldDur)) {
      return NextResponse.json({ error: "Conflict found: selected room or staff is already booked." }, { status: 409 });
    }
  }

  // Insert
  const { error: insErr } = await supabase.from("appointments").insert({
    user_id,
    service_id,
    appt_date,
    appt_time,
    duration_minutes: newDur,
    room_id,
    staff_id,
    notes: notes ?? null
  });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  await awardBadges(user_id);

  return NextResponse.json({ ok: true });
}