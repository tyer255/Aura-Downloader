const start = Date.now();
try {
    const res = await fetch("http://localhost:3000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
    });
    const json = await res.json();
    console.log("Time:", Date.now() - start, "ms");
    console.log("Success:", json.success);
} catch(e) {
    console.error(e);
}
