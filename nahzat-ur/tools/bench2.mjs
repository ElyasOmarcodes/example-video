import {chromium} from '/home/user/example-video/claude-motion/node_modules/playwright/index.mjs';
const [q, t] = process.argv.slice(2);
const browser = await chromium.launch({args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport: {width: 1080, height: 1920}});
await page.goto('http://127.0.0.1:8770/index.html?capture=1&' + q);
await page.waitForFunction(() => window.SIM && window.SIM.ready, null, {timeout: 300000});
const cdp = await page.context().newCDPSession(page);
await page.evaluate((x) => window.SIM.render(x), Number(t));
await cdp.send('Page.captureScreenshot', {format: 'jpeg', quality: 92});
let a = Date.now();
for (let i = 0; i < 6; i++) {
  await page.evaluate((x) => window.SIM.render(x), Number(t) + i / 30);
  await cdp.send('Page.captureScreenshot', {format: 'jpeg', quality: 92, optimizeForSpeed: true});
}
console.log(q, t, 'cdp per frame', ((Date.now() - a) / 6).toFixed(0), 'ms');
a = Date.now();
for (let i = 0; i < 6; i++) {
  await page.evaluate((x) => window.SIM.render(x), Number(t) + i / 30);
  await page.screenshot({type: 'jpeg', quality: 92});
}
console.log(q, t, 'pw per frame', ((Date.now() - a) / 6).toFixed(0), 'ms');
await browser.close();
