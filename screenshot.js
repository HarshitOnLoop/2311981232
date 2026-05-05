const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'dashboard.png', fullPage: true });

  await page.goto('http://localhost:3000/priority', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'priority_inbox.png', fullPage: true });

  await browser.close();
})();
