const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  // Wait a moment for any animations/renders
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97/actual_mobile_screenshot.png' });
  await browser.close();
})();
