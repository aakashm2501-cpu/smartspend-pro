const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  
  // Mobile Screenshot
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageMobile.goto('https://smartspend-pro.vercel.app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await pageMobile.screenshot({ path: 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97/actual_mobile_screenshot.png' });
  
  // Desktop Screenshot
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900 });
  await pageDesktop.goto('https://smartspend-pro.vercel.app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await pageDesktop.screenshot({ path: 'C:/Users/aakash.m/.gemini/antigravity/brain/8686e692-d27d-4da1-a95e-8a2691c7cb97/actual_desktop_screenshot.png' });
  
  await browser.close();
})();
