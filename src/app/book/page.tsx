"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
};

type StaffRow = {
  id: number;
  name: string;
  position: string;
};

type RoomRow = {
  id: number;
  name: string;
};

type ExistingAppointment = {
  id: number;
  staff_id: number | null;
  room_id: number | null;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
  status?: string | null;
};

type BadgeLookupRow = {
  id: number;
  is_used?: boolean;
  badges?:
    | {
        code?: string | null;
        reward?: string | null;
        name?: string | null;
      }
    | {
        code?: string | null;
        reward?: string | null;
        name?: string | null;
      }[]
    | null;
};

const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 17 * 60;
const SLOT_INTERVAL = 15;
const BUFFER_MINUTES = 15;

const COUPON_REWARDS: Record<string, string> = {
  LEVEL_BRONZE_FIRST_VISIT: "Complimentary herbal tea or wellness drink",
  LEVEL_SILVER_3_VISITS: "10% discount on next spa treatment; Early booking access",
  LEVEL_GOLD_5_VISITS: "Free aromatherapy add-on for any massage",
  LEVEL_PLATINUM_10_VISITS: "Complimentary 30-minute massage upgrade",
  LEVEL_ELITE_15_VISITS:
    "Exclusive spa gift set; Special discount on premium packages",
  SPECIAL_FEEDBACK_REVIEW: "5% discount coupon",
  SPECIAL_REFERRAL_FRIEND: "Free aromatherapy add-on",
  SPECIAL_BIRTHMONTH: "Free spa enhancement",
  SPECIAL_WELLNESS_STREAK_3MONTH: "Special loyalty discount",
};

function BookPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function normalizeCategory(category: string | null | undefined) {
    return String(category ?? "").trim().toLowerCase();
  }

  function getWarmCategoryTextColor(category: string | null | undefined) {
    const cat = normalizeCategory(category);
    if (cat.includes("massage")) return "#9b5a2e";
    if (cat.includes("facial")) return "#b86b4f";
    if (cat.includes("body") || cat.includes("scrub") || cat.includes("wrap")) return "#a15a43";
    if (cat.includes("addon")) return "#8b6a3d";
    return "#7e5a36";
  }

  function getWarmCategoryBadgeStyle(category: string | null | undefined) {
    const cat = normalizeCategory(category);

    if (cat.includes("massage")) {
      return { color: "#7f431d", background: "#f8e7d8", border: "1px solid #e2bea0" };
    }

    if (cat.includes("facial")) {
      return { color: "#8f4a36", background: "#fae6df", border: "1px solid #e8b9ac" };
    }

    if (cat.includes("body") || cat.includes("scrub") || cat.includes("wrap")) {
      return { color: "#7f4331", background: "#f7e1da", border: "1px solid #dfb1a4" };
    }

    if (cat.includes("addon")) {
      return { color: "#70542d", background: "#f7ecd8", border: "1px solid #e1c79b" };
    }

    return { color: "#6d5030", background: "#f3e6d8", border: "1px solid #dcc3a7" };
  }

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Service[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRow[]>([]);
  const [allRooms, setAllRooms] = useState<RoomRow[]>([]);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [staffId, setStaffId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffRow[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomRow[]>([]);
  const [fullyBookedDates, setFullyBookedDates] = useState<Date[]>([]);

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponReward, setCouponReward] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showQrModal, setShowQrModal] = useState(false);

  const didInitialPrefill = useRef(false);
  const lastPrefillKeyRef = useRef("");

  function formatDateLocal(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function norm(v: string | null | undefined) {
    return (v ?? "")
      .toLowerCase()
      .replace(/[\s_]/g, "")
      .replace(/-+/g, "");
  }

  function isAddon(cat: string | null | undefined) {
    return norm(cat).includes("addon");
  }

  function normalizeCoupon(v: string) {
    return v.trim().toUpperCase();
  }

  function clearCouponState(clearMessage = false) {
    setCouponInput("");
    setCouponCode("");
    setCouponReward("");
    localStorage.removeItem("selected_coupon_code");
    localStorage.removeItem("selected_coupon_reward");
    if (clearMessage) {
      setMsg("");
    }
  }

  function toggleAddon(addonId: number) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  }

  function timeToMinutes(t: string) {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  }

  function minutesToTimeValue(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function formatTimeLabel(total: number) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const ampm = hour24 < 12 ? "AM" : "PM";
    return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
  }

  function overlaps(startA: number, durA: number, startB: number, durB: number) {
    const endA = startA + durA;
    const endB = startB + durB;
    return startA < endB && startB < endA;
  }

  async function findValidCouponForUser(
    rawCode: string,
    rewardFromUrl?: string
  ): Promise<{
    ok: boolean;
    badgeRowId: number | null;
    code: string;
    reward: string;
    message?: string;
  }> {
    const code = normalizeCoupon(rawCode);

    if (!code) {
      return {
        ok: false,
        badgeRowId: null,
        code: "",
        reward: "",
        message: "Invalid coupon code.",
      };
    }

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (authErr || !uid) {
      return {
        ok: false,
        badgeRowId: null,
        code: "",
        reward: "",
        message: "Please login first.",
      };
    }

    const { data, error } = await supabase
      .from("user_badges")
      .select(`
        id,
        is_used,
        badges!inner(
          code,
          reward,
          name
        )
      `)
      .eq("user_id", uid)
      .eq("is_used", false)
      .eq("badges.code", code)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        badgeRowId: null,
        code: "",
        reward: "",
        message: error.message,
      };
    }

    if (!data) {
      return {
        ok: false,
        badgeRowId: null,
        code: "",
        reward: "",
        message: "This coupon is invalid, already used, or does not belong to your account.",
      };
    }

    const row = data as BadgeLookupRow;
    const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;

    const matchedCode = normalizeCoupon(badge?.code || code);
    const matchedReward = badge?.reward || rewardFromUrl || COUPON_REWARDS[matchedCode] || "";

    return {
      ok: true,
      badgeRowId: row.id,
      code: matchedCode,
      reward: matchedReward,
    };
  }

  async function applyCoupon(codeRaw: string, rewardFromUrl?: string) {
    const code = normalizeCoupon(codeRaw);

    if (!code) {
      clearCouponState();
      return;
    }

    const result = await findValidCouponForUser(code, rewardFromUrl);

    if (!result.ok) {
      clearCouponState();
      setMsg(result.message || "Invalid coupon code.");
      return;
    }

    setCouponInput(result.code);
    setCouponCode(result.code);
    setCouponReward(result.reward);

    localStorage.setItem("selected_coupon_code", result.code);
    localStorage.setItem("selected_coupon_reward", result.reward || "");

    setMsg("Coupon applied ✅");
    setTimeout(() => setMsg(""), 1200);
  }

  const mainService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  const selectedAddonRows = useMemo(
    () => addons.filter((a) => selectedAddons.includes(a.id)),
    [addons, selectedAddons]
  );

  const servicesByCategory = useMemo(() => {
    const grouped = new Map<string, Service[]>();

    services.forEach((s) => {
      const key = s.category?.trim() || "Other Services";
      const current = grouped.get(key) ?? [];
      current.push(s);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries());
  }, [services]);

  const totalDuration = useMemo(() => {
    const main = mainService?.duration_minutes ?? 0;
    const addonDur = selectedAddonRows.reduce(
      (sum, a) => sum + (a.duration_minutes ?? 0),
      0
    );
    return main + addonDur;
  }, [mainService, selectedAddonRows]);

  const blockedDuration = useMemo(() => {
    if (!mainService) return 0;
    return totalDuration + BUFFER_MINUTES;
  }, [mainService, totalDuration]);

  const totalPrice = useMemo(() => {
    const main = mainService?.price ?? 0;
    const addonPrice = selectedAddonRows.reduce((sum, a) => sum + (a.price ?? 0), 0);
    return main + addonPrice;
  }, [mainService, selectedAddonRows]);

  const discountAmount = useMemo(() => {
    if (!couponCode) return 0;

    if (couponCode === "SPECIAL_FEEDBACK_REVIEW") {
      return totalPrice * 0.05;
    }

    if (couponCode === "LEVEL_SILVER_3_VISITS") {
      return totalPrice * 0.1;
    }

    return 0;
  }, [couponCode, totalPrice]);

  const finalTotal = useMemo(() => {
    return Math.max(0, totalPrice - discountAmount);
  }, [totalPrice, discountAmount]);

  const candidateStaff = useMemo(() => {
    if (!mainService) return [];

    const category = (mainService.category ?? "").toLowerCase();

    if (category.includes("massage")) {
      return allStaff.filter((s) => s.position === "massage_therapist");
    }

    return allStaff.filter((s) => s.position === "spa_attendant");
  }, [mainService, allStaff]);

  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];

    if (!mainService || blockedDuration <= 0) return slots;

    for (let t = OPEN_MINUTES; t <= CLOSE_MINUTES; t += SLOT_INTERVAL) {
      const end = t + blockedDuration;

      if (end <= CLOSE_MINUTES) {
        slots.push({
          value: minutesToTimeValue(t),
          label: `${formatTimeLabel(t)} - ${formatTimeLabel(t + totalDuration)}`,
        });
      }
    }

    return slots;
  }, [mainService, totalDuration, blockedDuration]);

  useEffect(() => {
    async function init() {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: svc, error: svcErr } = await supabase
        .from("services")
        .select("id,name,description,duration_minutes,price,category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (svcErr) {
        setMsg(svcErr.message);
        return;
      }

      const all = (svc ?? []) as Service[];
      setAddons(all.filter((x) => isAddon(x.category)));
      setServices(all.filter((x) => !isAddon(x.category)));

      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("id,name,position")
        .order("name", { ascending: true });

      if (stErr) {
        setMsg(stErr.message);
        return;
      }
      setAllStaff((st ?? []) as StaffRow[]);

      const { data: rm, error: rmErr } = await supabase
        .from("rooms")
        .select("id,name")
        .order("name", { ascending: true });

      if (rmErr) {
        setMsg(rmErr.message);
        return;
      }
      setAllRooms((rm ?? []) as RoomRow[]);
    }

    init();
  }, [router]);

  useEffect(() => {
    const fromUrl = searchParams.get("coupon");
    const rewardFromUrl = searchParams.get("reward") || "";

    if (!fromUrl) return;

    const normalized = normalizeCoupon(fromUrl);
    setCouponInput(normalized);
    applyCoupon(normalized, rewardFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function validateStoredCoupon() {
      const storedCoupon = localStorage.getItem("selected_coupon_code") || "";
      const storedReward = localStorage.getItem("selected_coupon_reward") || "";

      if (!storedCoupon || searchParams.get("coupon")) return;

      const result = await findValidCouponForUser(storedCoupon, storedReward);

      if (!result.ok) {
        clearCouponState();
        return;
      }

      setCouponInput(result.code);
      setCouponCode(result.code);
      setCouponReward(result.reward);
    }

    validateStoredCoupon();
  }, [searchParams]);

  useEffect(() => {
    if (services.length === 0) return;

    const serviceName = searchParams.get("service");
    const addonNames = searchParams.get("addons");

    // Re-apply prefill whenever query params change (e.g. clicking a package CTA on /book).
    const prefillKey = `${serviceName || ""}__${addonNames || ""}`;
    if (prefillKey === lastPrefillKeyRef.current) return;

    let matchedServiceId: number | "" = "";
    let matchedAddonIds: number[] = [];

    if (serviceName) {
      const matchedService = services.find(
        (s) => s.name.trim().toLowerCase() === serviceName.trim().toLowerCase()
      );

      if (matchedService) {
        matchedServiceId = matchedService.id;
      }
    }

    if (addonNames && addons.length > 0) {
      const names = addonNames
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      matchedAddonIds = addons
        .filter((a) => names.includes(a.name.trim().toLowerCase()))
        .map((a) => a.id);
    }

    if (matchedServiceId !== "") {
      setServiceId(matchedServiceId);
    }

    if (matchedAddonIds.length > 0) {
      setSelectedAddons(matchedAddonIds);
    } else if (addonNames) {
      setSelectedAddons([]);
    }

    didInitialPrefill.current = true;
    lastPrefillKeyRef.current = prefillKey;
  }, [searchParams, services, addons]);

  useEffect(() => {
    async function loadFullyBookedDates() {
      if (allRooms.length === 0) return;

      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);

      const startStr = formatDateLocal(today);
      const endStr = formatDateLocal(end);

      const { data, error } = await supabase
        .from("appointments")
        .select("appt_date, appt_time, duration_minutes, room_id, status")
        .gte("appt_date", startStr)
        .lte("appt_date", endStr)
        .neq("status", "cancelled");

      if (error) {
        console.error(error.message);
        return;
      }

      const rows = (data ?? []) as ExistingAppointment[];
      const booked: Date[] = [];

      for (let i = 0; i <= 30; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);

        const dayStr = formatDateLocal(day);
        const dayRows = rows.filter((r) => r.appt_date === dayStr);

        let hasAnyAvailableSlot = false;

        for (let start = OPEN_MINUTES; start <= CLOSE_MINUTES; start += SLOT_INTERVAL) {
          const endTime = start + 75;
          if (endTime > CLOSE_MINUTES) continue;

          const freeRooms = allRooms.filter((room) => {
            const roomAppointments = dayRows.filter((r) => r.room_id === room.id);

            return !roomAppointments.some((r) => {
              const existingStart = timeToMinutes(String(r.appt_time).slice(0, 5));
              const existingDur = r.duration_minutes ?? 0;
              return overlaps(start, 75, existingStart, existingDur);
            });
          });

          if (freeRooms.length > 0) {
            hasAnyAvailableSlot = true;
            break;
          }
        }

        if (!hasAnyAvailableSlot) {
          booked.push(new Date(day));
        }
      }

      setFullyBookedDates(booked);
    }

    loadFullyBookedDates();
  }, [allRooms]);

  const previousServiceId = useRef<number | "">("");

  useEffect(() => {
    if (serviceId === "") return;

    const isInitialAutofill =
      previousServiceId.current === "" && didInitialPrefill.current;

    setStaffId("");
    setRoomId("");
    setTime("");

    if (!isInitialAutofill) {
      setSelectedAddons([]);
    }

    previousServiceId.current = serviceId;
  }, [serviceId]);

  useEffect(() => {
    setStaffId("");
    setRoomId("");
  }, [date, time, selectedAddons.length]);

  useEffect(() => {
    if (!time || blockedDuration <= 0) return;

    const start = timeToMinutes(time);
    const end = start + blockedDuration;

    if (end > CLOSE_MINUTES) {
      setTime("");
      setMsg("Selected service duration goes beyond business hours. Please choose an earlier time.");
    }
  }, [time, blockedDuration]);

  useEffect(() => {
    async function checkAvailability() {
      setAvailableStaff([]);
      setAvailableRooms([]);

      if (!mainService || !date || !time || blockedDuration <= 0) return;

      const start = timeToMinutes(time);
      const end = start + blockedDuration;

      if (end > CLOSE_MINUTES) {
        setMsg("This service cannot fit in the remaining business hours.");
        return;
      }

      const { data: existing, error } = await supabase
        .from("appointments")
        .select("id,staff_id,room_id,appt_date,appt_time,duration_minutes,status")
        .eq("appt_date", date)
        .neq("status", "cancelled");

      if (error) {
        setMsg(error.message);
        return;
      }

      const rows = (existing ?? []) as ExistingAppointment[];

      const freeStaff = candidateStaff.filter((staff) => {
        const staffAppointments = rows.filter((r) => r.staff_id === staff.id);

        if (staffAppointments.length >= 8) return false;

        return !staffAppointments.some((r) =>
          overlaps(
            start,
            blockedDuration,
            timeToMinutes(String(r.appt_time).slice(0, 5)),
            r.duration_minutes ?? 0
          )
        );
      });

      const freeRooms = allRooms.filter((room) => {
        const roomAppointments = rows.filter((r) => r.room_id === room.id);

        return !roomAppointments.some((r) =>
          overlaps(
            start,
            blockedDuration,
            timeToMinutes(String(r.appt_time).slice(0, 5)),
            r.duration_minutes ?? 0
          )
        );
      });

      setAvailableStaff(freeStaff);
      setAvailableRooms(freeRooms);

      if (staffId && !freeStaff.some((s) => s.id === staffId)) setStaffId("");
      if (roomId && !freeRooms.some((r) => r.id === roomId)) setRoomId("");
    }

    checkAvailability();
  }, [mainService, date, time, blockedDuration, candidateStaff, allRooms, staffId, roomId]);

  async function validateAndBook() {
    setMsg("");

    if (!serviceId || !date || !time || !staffId || !roomId) {
      setMsg("Please complete all required fields.");
      return;
    }

    if (!mainService) {
      setMsg("Please select a service.");
      return;
    }

    const start = timeToMinutes(time);
    const end = start + blockedDuration;

    if (end > CLOSE_MINUTES) {
      setMsg("This appointment exceeds business hours. Please choose an earlier time.");
      return;
    }

    if (paymentMethod === "GCash" || paymentMethod === "Maya") {
      setShowQrModal(true);
      return;
    }
    await executeBooking();
  }

  async function executeBooking() {
    setShowQrModal(false);

    if (!mainService || !serviceId || !date || !time || !staffId || !roomId) {
      setMsg("Please complete all required fields.");
      return;
    }

    const start = timeToMinutes(time);

    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

      let validUserBadgeId: number | null = null;
      let validCouponCode = "";
      let validCouponReward = "";

      if (couponCode) {
        const couponCheck = await findValidCouponForUser(couponCode, couponReward);

        if (!couponCheck.ok) {
          clearCouponState();
          setMsg(
            couponCheck.message ||
              "This coupon is invalid, already used, or does not belong to your account."
          );
          return;
        }

        validUserBadgeId = couponCheck.badgeRowId;
        validCouponCode = couponCheck.code;
        validCouponReward = couponCheck.reward;

        setCouponCode(validCouponCode);
        setCouponReward(validCouponReward);
      }

      const { data: existing, error: existingErr } = await supabase
        .from("appointments")
        .select("id,staff_id,room_id,appt_date,appt_time,duration_minutes,status")
        .eq("appt_date", date)
        .neq("status", "cancelled");

      if (existingErr) {
        setMsg(existingErr.message);
        return;
      }

      const rows = (existing ?? []) as ExistingAppointment[];
      const staffAppointments = rows.filter((r) => r.staff_id === Number(staffId));
      const roomAppointments = rows.filter((r) => r.room_id === Number(roomId));

      if (staffAppointments.length >= 8) {
        setMsg("This staff member already reached the daily booking limit.");
        return;
      }

      const staffConflict = staffAppointments.some((r) =>
        overlaps(
          start,
          blockedDuration,
          timeToMinutes(String(r.appt_time).slice(0, 5)),
          r.duration_minutes ?? 0
        )
      );

      if (staffConflict) {
        setMsg("Selected staff is not available at that time.");
        return;
      }

      const roomConflict = roomAppointments.some((r) =>
        overlaps(
          start,
          blockedDuration,
          timeToMinutes(String(r.appt_time).slice(0, 5)),
          r.duration_minutes ?? 0
        )
      );

      if (roomConflict) {
        setMsg("Selected room is occupied at that time. Please choose another room.");
        return;
      }

      const payload = {
        user_id: uid,
        service_id: Number(serviceId),
        staff_id: Number(staffId),
        room_id: Number(roomId),
        appt_date: date,
        appt_time: time,
        duration_minutes: blockedDuration,
        status: "confirmed",
        total_price: finalTotal,
        coupon_code: validCouponCode || null,
        coupon_reward: validCouponCode ? validCouponReward || null : null,
        discount_amount: validCouponCode ? discountAmount || 0 : 0,
        payment_method: paymentMethod,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("appointments")
        .insert([payload])
        .select("id")
        .single();

      if (insErr || !inserted) {
        setMsg(insErr?.message || "Failed to book appointment.");
        return;
      }

      const appointmentId = inserted.id as number;

      if (selectedAddons.length > 0) {
        const rowsToInsert = selectedAddons.map((addonId) => ({
          appointment_id: appointmentId,
          addon_service_id: addonId,
        }));

        const { error: addonErr } = await supabase
          .from("appointment_addons")
          .insert(rowsToInsert);

        if (addonErr) {
          setMsg("Booked, but add-ons failed to save: " + addonErr.message);
          return;
        }
      }

      if (validUserBadgeId) {
        const { error: couponUseErr } = await supabase
          .from("user_badges")
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
          })
          .eq("id", validUserBadgeId)
          .eq("user_id", uid)
          .eq("is_used", false);

        if (couponUseErr) {
          setMsg("Appointment booked, but coupon update failed. Please contact admin.");
          return;
        }
      }

      const selectedStaff = allStaff.find((s) => s.id === Number(staffId));
      const selectedRoom = allRooms.find((r) => r.id === Number(roomId));

      try {
        await fetch("/api/send-booking-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: auth.user?.email,
            customerName:
              auth.user?.user_metadata?.full_name ||
              auth.user?.email?.split("@")[0] ||
              "Customer",
            serviceName: mainService.name,
            addonNames: selectedAddonRows.map((a) => a.name),
            apptDate: date,
            apptTime: time,
            durationMinutes: totalDuration,
            staffName: selectedStaff?.name || "Not assigned",
            roomName: selectedRoom?.name || "Not assigned",
            totalPrice: finalTotal,
            couponCode: validCouponCode || "",
            couponReward: validCouponReward || "",
            paymentMethod,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send booking email:", emailErr);
      }

      clearCouponState();
      setMsg("Appointment booked successfully ✅");

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="bookingContainer">
        <div className="card cardPad bookingCard">
          <h2 style={{ marginTop: 0 }}>Book Appointment</h2>

          {msg && (
            <div
              className={msg.includes("✅") ? "noticeOk" : "notice"}
              style={{ marginBottom: 12 }}
            >
              {msg}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label>Service</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select service</option>
              {servicesByCategory.map(([categoryName, list]) => (
                <optgroup key={categoryName} label={categoryName}>
                  {list.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₱{s.price} • {s.duration_minutes} mins
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {mainService?.category && (
              <div
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  ...getWarmCategoryBadgeStyle(mainService.category),
                }}
              >
                Category: {mainService.category}
              </div>
            )}
          </div>

          {mainService && (
            <div style={{ marginTop: 16 }}>
              <label>
                Add-Ons <span style={{ color: "var(--muted)" }}>(optional)</span>
              </label>

              <div
                className="card"
                style={{
                  marginTop: 8,
                  padding: "14px 16px",
                  borderRadius: 16,
                  boxShadow: "none",
                }}
              >
                {addons.length === 0 ? (
                  <p style={{ color: "var(--muted)", margin: 0 }}>No add-ons available.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {addons.map((a) => {
                      const checked = selectedAddons.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          style={{ display: "flex", gap: 10, alignItems: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(a.id)}
                            style={{ width: 16, height: 16 }}
                          />
                          <div style={{ flex: 1 }}>
                            <b>{a.name}</b>{" "}
                            <span style={{ color: "var(--muted)" }}>
                              — ₱{a.price} • {a.duration_minutes} mins
                            </span>
                            {a.category && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  ...getWarmCategoryBadgeStyle(a.category),
                                }}
                              >
                                {a.category}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <label>Coupon Code</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  <input
                    className="input"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Type or paste coupon code"
                    style={{ flex: 1, minWidth: 240 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => applyCoupon(couponInput)}
                  >
                    Apply Coupon
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => clearCouponState(true)}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {(couponCode || couponReward) && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    border: "1px solid #dfe5df",
                    borderRadius: 14,
                    background: "#f8fff8",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Applied Coupon</div>
                  <div style={{ marginTop: 6 }}>{couponCode}</div>
                  {couponReward && (
                    <div style={{ marginTop: 6, color: "#4c7c59" }}>
                      {couponReward}
                    </div>
                  )}
                </div>
              )}

              <p style={{ marginTop: 10, color: "var(--muted)" }}>
                Total estimate: <b>₱{finalTotal.toFixed(0)}</b>
              </p>

              {discountAmount > 0 && (
                <p style={{ marginTop: 4, color: "#4c7c59", fontWeight: 600 }}>
                  Discount applied: -₱{discountAmount.toFixed(0)}
                </p>
              )}

              <p style={{ marginTop: 4, color: "var(--muted)" }}>
                Service duration: <b>{totalDuration} mins</b>
              </p>
              <p style={{ marginTop: 4, color: "var(--muted)" }}>
                Blocked schedule time: <b>{blockedDuration} mins</b>
                {BUFFER_MINUTES > 0 ? ` (includes ${BUFFER_MINUTES} mins reset time)` : ""}
              </p>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label>Date</label>
            <div className="calendarWrap">
              <DayPicker
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(selected) => {
                  if (!selected) return;
                  setDate(formatDateLocal(selected));
                }}
                disabled={[{ before: new Date() }, ...fullyBookedDates]}
                modifiers={{ booked: fullyBookedDates }}
                modifiersClassNames={{ booked: "booked-day" }}
              />

              <div className="calendarLegend">
                <span>
                  <i className="calendarDot green" />
                  Available
                </span>
                <span>
                  <i className="calendarDot red" />
                  Fully booked
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Time</label>
            <select
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!mainService}
            >
              <option value="">
                {!mainService ? "Select service first" : "Select time"}
              </option>
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Staff</label>
            <select
              value={staffId}
              disabled={!mainService || !date || !time}
              onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">
                {!mainService || !date || !time
                  ? "Select service, date, and time first"
                  : availableStaff.length === 0
                  ? "No available staff"
                  : "Select staff"}
              </option>
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Room</label>
            <select
              value={roomId}
              disabled={!mainService || !date || !time}
              onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">
                {!mainService || !date || !time
                  ? "Select service, date, and time first"
                  : availableRooms.length === 0
                  ? "No available room"
                  : "Select room"}
              </option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 700, fontSize: 15 }}>Payment Method</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginTop: 10,
              }}
            >
              {/* Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod("Cash")}
                style={{
                  padding: "16px 8px",
                  borderRadius: 16,
                  border: paymentMethod === "Cash" ? "2.5px solid #3a6e47" : "1.5px solid #e0e0e0",
                  background: paymentMethod === "Cash" ? "#eaf1ec" : "#fafafa",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#d4edda", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  💵
                </div>
                <span style={{ fontWeight: paymentMethod === "Cash" ? 700 : 500, fontSize: 13, color: "#222" }}>Cash</span>
                {paymentMethod === "Cash" && <span style={{ fontSize: 10, color: "#3a6e47", fontWeight: 700 }}>✔ SELECTED</span>}
              </button>

              {/* GCash */}
              <button
                type="button"
                onClick={() => setPaymentMethod("GCash")}
                style={{
                  padding: "16px 8px",
                  borderRadius: 16,
                  border: paymentMethod === "GCash" ? "2.5px solid #007DFF" : "1.5px solid #e0e0e0",
                  background: paymentMethod === "GCash" ? "#e8f2ff" : "#fafafa",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#007DFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 15, letterSpacing: "-0.5px" }}>
                  G
                </div>
                <span style={{ fontWeight: paymentMethod === "GCash" ? 700 : 500, fontSize: 13, color: "#007DFF" }}>GCash</span>
                {paymentMethod === "GCash" && <span style={{ fontSize: 10, color: "#007DFF", fontWeight: 700 }}>✔ SELECTED</span>}
              </button>

              {/* Maya */}
              <button
                type="button"
                onClick={() => setPaymentMethod("Maya")}
                style={{
                  padding: "16px 8px",
                  borderRadius: 16,
                  border: paymentMethod === "Maya" ? "2.5px solid #0A3D6B" : "1.5px solid #e0e0e0",
                  background: paymentMethod === "Maya" ? "#e6f0f8" : "#fafafa",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A3D6B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 15 }}>
                  M
                </div>
                <span style={{ fontWeight: paymentMethod === "Maya" ? 700 : 500, fontSize: 13, color: "#0A3D6B" }}>Maya</span>
                {paymentMethod === "Maya" && <span style={{ fontSize: 10, color: "#0A3D6B", fontWeight: 700 }}>✔ SELECTED</span>}
              </button>
            </div>

            {(paymentMethod === "GCash" || paymentMethod === "Maya") && (
              <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
                A {paymentMethod} QR code will appear after you click &ldquo;Book Now&rdquo;. Scan and pay, then confirm.
              </p>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              className="btn btnPrimary"
              onClick={validateAndBook}
              disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 14 }}
            >
              {loading ? "Booking..." : "Book Now"}
            </button>
          </div>
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQrModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "32px 28px",
              width: "100%",
              maxWidth: 400,
              maxHeight: "min(92dvh, 680px)",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            {/* Brand bar */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: paymentMethod === "GCash" ? "#007DFF" : "#0A3D6B",
                borderRadius: 14,
                padding: "10px 28px",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
                {paymentMethod}
              </span>
            </div>

            <p style={{ color: "#666", fontSize: 14, marginBottom: 18, marginTop: 0 }}>
              Scan the QR code to pay. Once done, tap&nbsp;<b>I&apos;ve Paid</b>.
            </p>

            {/* QR code */}
            <div
              style={{
                width: 210,
                height: 210,
                margin: "0 auto 20px",
                borderRadius: 18,
                overflow: "hidden",
                border: "2px solid #e8e8e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f9f9f9",
              }}
            >
              <img
                src={paymentMethod === "GCash" ? "/gcash-qr.png" : "/maya-qr.png"}
                alt={`${paymentMethod} QR Code`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const p = e.currentTarget.parentElement;
                  if (p) p.innerHTML = `<div style="padding:20px;color:#999;font-size:12px;line-height:1.6">📷 Add your QR image at<br/><b>/public/${paymentMethod.toLowerCase()}-qr.png</b></div>`;
                }}
              />
            </div>

            {/* Amount */}
            <div
              style={{
                background: "#f4f8f4",
                borderRadius: 14,
                padding: "14px 20px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, color: "#999", letterSpacing: 1, textTransform: "uppercase" }}>Amount to Pay</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1a3a20", marginTop: 4 }}>
                ₱{finalTotal.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 2 }}>Ginhawa Spa</div>
            </div>

            {/* Confirm */}
            <button
              type="button"
              onClick={executeBooking}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 14,
                border: "none",
                background: paymentMethod === "GCash" ? "#007DFF" : "#0A3D6B",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              {loading ? "Confirming…" : "✅ I've Paid — Confirm Booking"}
            </button>

            {/* Back */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: "1.5px solid #e0e0e0",
                background: "#fff",
                color: "#666",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </SiteShell>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading booking page...</div>}>
      <BookPageInner />
    </Suspense>
  );
}