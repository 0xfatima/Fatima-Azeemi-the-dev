"use client";

export default function Error({ reset }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>Please try again in a moment.</p>
        <button onClick={() => reset()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", color: "inherit", cursor: "pointer" }}>
          Try again
        </button>
      </div>
    </main>
  );
}
