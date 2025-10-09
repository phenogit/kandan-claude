// Add at the very top of each file:
require("dotenv").config({ path: ".env.local" });

// test-api.js
async function testSignup() {
  console.log("🧪 Testing Signup API...\n");

  const response = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "apitest",
      email: "apitest@example.com",
      password: "testpass123",
      displayName: "API Test User",
    }),
  });

  const data = await response.json();

  if (data.success) {
    console.log("✅ Signup API works!");
    console.log("   User created:", data.data);
  } else {
    console.log("❌ Signup failed:", data.error);
  }
}

// Make sure dev server is running first!
console.log("⚠️  Make sure dev server is running: npm run dev\n");
setTimeout(() => {
  testSignup().catch((err) => console.error("❌ Error:", err.message));
}, 2000);
