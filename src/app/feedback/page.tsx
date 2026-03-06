"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

export default function FeedbackPage() {

const [text,setText] = useState("");
const [msg,setMsg] = useState("");

async function submit(){

const { data: auth } = await supabase.auth.getUser();

if(!auth.user){
setMsg("Login first.");
return;
}

const { error } = await supabase
.from("feedback")
.insert({
user_id: auth.user.id,
message: text
});

if(error){
setMsg(error.message);
}else{
setMsg("Thank you for your feedback 💚");
setText("");
}

}

return(
<SiteShell>

<div className="card cardPad">

<h2>Customer Feedback</h2>

<textarea
value={text}
onChange={(e)=>setText(e.target.value)}
placeholder="Share your spa experience..."
style={{
width:"100%",
minHeight:120,
padding:10,
borderRadius:10
}}
/>

<button
className="btn btnPrimary"
style={{marginTop:10}}
onClick={submit}
>
Submit Feedback
</button>

{msg && <p style={{marginTop:10}}>{msg}</p>}

</div>

</SiteShell>
);

}