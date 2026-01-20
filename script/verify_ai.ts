
async function verify() {
    try {
        const fetch = (await import("node-fetch")).default;

        // 1. Create Conversation
        console.log("Creating conversation...");
        const createRes = await fetch("http://localhost:5001/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Verification Chat" })
        });
        const conversation = await createRes.json();
        console.log("Conversation created:", conversation.id);

        // 2. Send Message
        console.log("Sending message...");
        const msgRes = await fetch(`http://localhost:5001/api/conversations/${conversation.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "What is the speed of light?" })
        });

        // Read stream
        const text = await msgRes.text();
        console.log("Response received:", text.slice(0, 200) + "...");
    } catch (e) {
        console.error("Verification failed:", e);
    }
}

verify();
