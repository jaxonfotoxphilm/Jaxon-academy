import puppeteer from 'puppeteer';

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

  console.log("Navigating to localhost...");
  await page.goto('http://localhost:5174');
  await new Promise(r => setTimeout(r, 2000));
  
  const profiles = await page.$$('text/Ayla');
  if (profiles.length > 0) {
    console.log('Clicking profile Ayla...');
    await profiles[0].click();
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('Profile Ayla not found. Trying anything else?');
    const html = await page.content();
    console.log(html.substring(0, 500));
  }

  await browser.close();
})();
