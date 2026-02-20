import { supabase } from "@/lib/supabaseClient";

export default async function ServicesPage() {
  const { data: services } = await supabase.from("services").select("*").order("name");

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto" }}>
      <h2>Spa Services</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {(services ?? []).map((s:any) => (
          <div key={s.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <p><b>₱{Number(s.price).toFixed(2)}</b> • {s.duration_minutes} min</p>
            <iframe
              src={s.video_url}
              style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 10 }}
              allowFullScreen
            />
            <p style={{ marginTop: 12 }}>
              <a href={`/book?service_id=${s.id}`}>Book this service →</a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}