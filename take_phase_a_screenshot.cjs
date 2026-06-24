const puppeteer = require('puppeteer');
const path = require('path');

const BRAIN_DIR = 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  // Dashboard
  // Dashboard Mobile
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_a_dashboard_mobile.png') });
  
  // Universal Add Sheet
  try {
    await page.click('button.w-14.h-14.bg-brand-orange'); // Click the FAB
    await new Promise(r => setTimeout(r, 1000)); // wait for animation
    await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_a_universal_add.png') });
  } catch (e) {
    console.log('FAB click failed', e);
  }

  // Plan Hub
  await page.goto('http://localhost:5174/plan', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_a_plan_mobile.png') });

  // Profile (Settings)
  await page.goto('http://localhost:5174/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_a_profile_mobile.png') });

  // Desktop Viewport
  await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_a_dashboard_desktop.png') });

  await browser.close();
})();
