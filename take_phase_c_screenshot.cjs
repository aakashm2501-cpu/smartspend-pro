const puppeteer = require('puppeteer');
const path = require('path');

const BRAIN_DIR = 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Dashboard Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_dashboard_mobile.png') });
  
  // Universal Add Mobile
  await page.click('nav button'); // click the FAB
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_universal_add_mobile.png') });
  // Close the sheet by clicking the background
  await page.mouse.click(10, 10);
  await new Promise(r => setTimeout(r, 1000));

  // Ledger Mobile
  await page.goto('http://localhost:5174/transactions', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_ledger_mobile.png') });

  // Debts Mobile
  await page.goto('http://localhost:5174/debts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_debts_mobile.png') });

  // Plan Mobile
  await page.goto('http://localhost:5174/plan', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_plan_mobile.png') });

  // Dashboard Desktop
  await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_c_dashboard_desktop.png') });

  await browser.close();
})();
