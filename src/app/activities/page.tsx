"use client";

import SiteShell from "@/components/SiteShell";

const activities = [
  {
    title: "Yoga",
    desc: "Improve flexibility & calm.",
    img: "/activities/yoga.jpg",
    urlLabel: "Bikram Yoga Manila / YogaPlus",
    url: "PASTE_OFFICIAL_YOGA_STUDIO_URL_HERE",
  },
  {
    title: "Pilates",
    desc: "Core strength training.",
    img: "/public/pilates.png",
    urlLabel: "Speranza Pilates BGC",
    url: "https://speranzapilates.com/",
  },
  {
    title: "Gym Workout",
    desc: "Build endurance & strength.",
    img: "/activities/gym.jpg",
    urlLabel: "Anytime Fitness PH / Fitness First PH",
    url: "PASTE_ANYTIME_FITNESS_PH_URL_HERE",
  },
  {
    title: "Book Classes (PH)",
    desc: "Find studios & schedules in your area.",
    img: "/activities/classpass.jpg",
    urlLabel: "ClassPass Manila",
    url: "PASTE_CLASSPASS_PH_URL_HERE",
  },
];

export default function ActivitiesPage() {
  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Wellness Activities</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Explore external wellness activities and book on their official sites.
        </p>
      </div>

      <div className="activityGrid">
        {activities.map((a) => (
          <div key={a.title} className="activityCard">
            <div className="activityImg">
              <img src={a.img} alt={a.title} />
            </div>

            <div className="activityBody">
              <div className="activityTag">External Booking</div>

              <h3 className="activityTitle">{a.title}</h3>
              <p className="activityDesc">{a.desc}</p>

              <a className="activityBtn" href={a.url} target="_blank" rel="noreferrer">
                Go to website →
              </a>
            </div>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}