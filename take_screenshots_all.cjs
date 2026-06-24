const puppeteer = require('puppeteer');
const path = require('path');

const BRAIN_DIR = 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  // Ledger (Transactions)
  await page.goto('http://localhost:5174/transactions', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'current_ledger_screenshot.png') });

  // Debts
  await page.goto('http://localhost:5174/debts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'current_debts_screenshot.png') });

  // Plan (Currently Bills)
  await page.goto('http://localhost:5174/bills', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'current_plan_screenshot.png') });

  // Profile (Currently Settings)
  await page.goto('http://localhost:5174/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(BRAIN_DIR, 'current_profile_screenshot.png') });

  await browser.close();
})();
