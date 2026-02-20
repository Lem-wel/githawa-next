export default function Home() {
  return (
    <main style={{maxWidth:900, margin:"40px auto", fontFamily:"Arial"}}>
      <h1>Ginhawa Spa & Wellness</h1>
      <p>Your personalized wellness and booking system</p>

      <div style={{marginTop:30, display:"flex", gap:20, flexWrap:"wrap"}}>
        <a href="/login"><button>Login</button></a>
        <a href="/register"><button>Register</button></a>
        <a href="/services"><button>Spa Services</button></a>
        <a href="/rewards"><button>Rewards</button></a>
      </div>

      <hr style={{margin:"40px 0"}}/>

      <h3>Features</h3>
      <ul>
        <li>Book spa appointments</li>
        <li>Service preview videos</li>
        <li>Wellness recommendations</li>
        <li>Milestone reward badges</li>
      </ul>
    </main>
  );
}