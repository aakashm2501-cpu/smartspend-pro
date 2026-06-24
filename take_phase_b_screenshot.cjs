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
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_b_dashboard_mobile.png') });
  
  // Ledger Mobile
  await page.goto('http://localhost:5174/transactions', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_b_ledger_mobile.png') });

  // Dashboard Desktop
  await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'phase_b_dashboard_desktop.png') });

  await browser.close();
})();
