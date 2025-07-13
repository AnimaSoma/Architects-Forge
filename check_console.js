const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  // Capture page errors
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  // Navigate to the local development server
  await page.goto('http://localhost:5179');
  
  // Wait a bit to make sure everything has a chance to load/error
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
