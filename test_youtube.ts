async function run() {
    const res = await fetch("http://localhost:3000/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.youtube.com/watch?v=jNQXAC9IVRw" })
    });
    console.log(await res.json());
}
run();
