const {chromium} = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const cid of ['president', 'general']) for (const kind of ['turnaround', 'details']) {
    const page = await browser.newPage({viewport: {width: 3000, height: 1000}, deviceScaleFactor: 1});
    await page.goto(`http://127.0.0.1:8765/out/sheets/${cid}_${kind}.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({path: path.join(__dirname, '..', 'out', 'sheets', `${cid}_${kind}.png`), fullPage: true});
    await page.close();
  }
  await browser.close(); console.log('sheets ok');
})();
