const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const artifactDir = 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97/';
  
  try {
    // Home (Orbit)
    console.log('Capturing Home...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(artifactDir, 'v3_home_mobile.png') });

    // Horizon (Plan Hub)
    console.log('Capturing Horizon...');
    await page.goto('http://localhost:3000/plan', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(artifactDir, 'v3_plan_mobile.png') });

    // Constellation (Debts)
    console.log('Capturing Constellation...');
    await page.goto('http://localhost:3000/debts', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(artifactDir, 'v3_debts_mobile.png') });

    // Ledger
    console.log('Capturing Ledger...');
    await page.goto('http://localhost:3000/transactions', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(artifactDir, 'v3_ledger_mobile.png') });

    // Profile
    console.log('Capturing Profile...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(artifactDir, 'v3_profile_mobile.png') });

    // Singularity (Universal Add Flow) - Closed state is any page, already captured.
    // Let's trigger the expanded state on Home
    console.log('Capturing Singularity...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    // Find and click the central Universal Add FAB
    // It's in the Bottom Nav
    const fabSelector = 'nav.fixed.bottom-0 button';
    await page.waitForSelector(fabSelector);
    await page.click(fabSelector);
    
    // Wait for animation to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: path.join(artifactDir, 'v3_singularity_mobile.png') });

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
