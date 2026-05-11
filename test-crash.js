const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  await page.goto('http://localhost:5174');
  await new Promise(r => setTimeout(r, 2000));
  
  const profiles = await page.$$('text/Ayla');
  if (profiles.length > 0) {
    console.log('Clicking profile...');
    await profiles[0].click();
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('Profile Ayla not found.');
  }

  await browser.close();
})();
