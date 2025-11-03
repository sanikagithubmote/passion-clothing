#!/usr/bin/env node

/**
 * Test script for invoice API
 * Tests: GET /api/documents/timeline/:orderId
 */

const axios = require("axios");
require("dotenv").config();

const API_BASE = "http://localhost:5000/api";

async function testInvoiceAPI() {
  try {
    console.log("🧪 Testing Invoice Timeline API\n");

    // Step 1: Login to get token
    console.log("📝 Step 1: Logging in...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@passion.com",
      password: "123456",
    });

    const token = loginRes.data.token;
    console.log(
      "✅ Login successful! Got token:",
      token.substring(0, 20) + "...\n"
    );

    // Step 2: Test timeline endpoint
    console.log("📝 Step 2: Fetching timeline for Sales Order ID 1...");
    const timelineRes = await axios.get(`${API_BASE}/documents/timeline/1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Timeline API Response:");
    console.log(JSON.stringify(timelineRes.data, null, 2));

    if (timelineRes.data.success) {
      console.log("\n🎉 SUCCESS! API is working correctly!");
      console.log(`   - Found ${timelineRes.data.documents.length} documents`);
      console.log(`   - Pending count: ${timelineRes.data.pending}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

testInvoiceAPI();
