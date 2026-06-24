import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = "C:\\Users\\aakash.m\\.gemini\\antigravity\\brain\\8686e692-d27d-4da1-a95e-8a2691c7cb97";

async function run() {
  const browser = await puppeteer.launch();
  
  // MOBILE SCREENSHOTS
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); // iPhone 12/13
  
  // Home
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_home_mobile.png') });
  
  // Ledger
  await mobilePage.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle0' });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_ledger_mobile.png') });
  
  // Circle
  await mobilePage.goto('http://localhost:5173/debts', { waitUntil: 'networkidle0' });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_debts_mobile.png') });
  
  // Plan
  await mobilePage.goto('http://localhost:5173/plan', { waitUntil: 'networkidle0' });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_plan_mobile.png') });
  
  // Profile
  await mobilePage.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_profile_mobile.png') });
  
  // Universal Add Flow
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Find the button inside the bottom nav bar (last button with Plus icon)
  // Usually it's the large white FAB.
  try {
    // Wait for the FAB to appear
    await mobilePage.waitForSelector('nav.fixed.bottom-0 button', { timeout: 5000 });
    await mobilePage.click('nav.fixed.bottom-0 button');
    await new Promise(r => setTimeout(r, 1000)); // Wait for animation
    await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_add_flow_mobile.png') });
  } catch (e) {
    console.error("Could not click Universal Add FAB", e);
  }

  await mobilePage.close();

  // DESKTOP SCREENSHOTS
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await desktopPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_home_desktop.png') });
  
  await desktopPage.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle0' });
  await desktopPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'new_ledger_desktop.png') });

  await desktopPage.close();
  await browser.close();
  console.log("Screenshots completed successfully.");
}

run().catch(console.error);
