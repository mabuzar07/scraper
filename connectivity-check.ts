import { chromium } from "playwright";

async function checkConnectivity() {
  console.log("🔍 Network Connectivity Checker");
  console.log("================================\n");

  const browser = await chromium.launch({ 
    headless: false, // Show browser
    timeout: 30000 
  });

  try {
    const page = await browser.newPage();
    
    // Test basic connectivity
    console.log("1. Testing basic connectivity...");
    try {
      await page.goto("https://httpbin.org/status/200", { timeout: 15000 });
      console.log("✅ Basic connectivity: OK");
    } catch (error) {
      console.log("❌ Basic connectivity: FAILED");
      throw error;
    }

    // Test StubHub domain
    console.log("\n2. Testing StubHub domain access...");
    try {
      await page.goto("https://www.stubhub.com", { timeout: 30000 });
      console.log("✅ StubHub domain: OK");
    } catch (error) {
      console.log("❌ StubHub domain: FAILED");
      console.log("Error:", error.message);
    }

    // Test specific event page
    console.log("\n3. Testing specific event page...");
    try {
      await page.goto("https://www.stubhub.com/event/158248339/?quantity=0", { 
        timeout: 45000,
        waitUntil: "domcontentloaded" 
      });
      console.log("✅ Event page: OK");
      
      // Check if page loaded correctly
      const title = await page.title();
      console.log("Page title:", title);
      
      if (title.toLowerCase().includes("stubhub")) {
        console.log("✅ Page content: OK");
      } else {
        console.log("⚠️ Page content: Unexpected title");
      }
      
    } catch (error) {
      console.log("❌ Event page: FAILED");
      console.log("Error:", error.message);
    }

    console.log("\n📋 Connectivity test completed");
    console.log("If all tests passed, the StubHub scraper should work");

  } finally {
    await browser.close();
  }
}

checkConnectivity().catch(error => {
  console.error("❌ Connectivity check failed:", error.message);
  process.exit(1);
});
