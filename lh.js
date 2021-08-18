const fs = require("fs");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator");
const md5 = require('md5');
const timestamp = require('time-stamp');

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36"
const USERNAME = "username";
const PASSWORD = "pw";
const PORT = 8041;
const LOGIN_URL = "https://example.com/login"
const URLS = [
  "https://example.com/",
  "https://example.com/questions",
  "https://example.com/mypage"
]

const flags = {
  logLevel: "info", // or silent|error|info|debug
  emulatedUserAgent: UA,
  port: PORT, // puppeteerで利用するブラウザと同じPORTを利用することで、sessionが継続される
  disableStorageReset: true,
};

const selector = {
  class(attribute, className) {
    return `${attribute}[class='${className}']`
  },
  type(attribute, value) {
    return `${attribute}[type='${value}']`
  },
  id(value) {
    return `#${value}`
  }
}

const config = {
  extends: "lighthouse:default",
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    formFactor: "desktop",
    // skipAudits: ["uses-http2"],
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },

  },
};

const main = async () => {
  console.info("Now login ...");
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: true,
  });
  const page = await browser.newPage();

  await page.goto(LOGIN_URL);

  await page.type(selector.id('email'), USERNAME);
  await page.type(selector.id('password'), PASSWORD);
  await Promise.all([page.click(selector.type('button', 'submit')), page.waitForNavigation()]);

  await page.close(); // ページは閉じるが、ブラウザは閉じない

  console.info("Running lighthouse ...");

  for (const url of URLS) {
    // TODO: lighthouse ci だとセッションを保持してくれない。。。？browserが保持してくれなかった
    const result = await lighthouse(url, flags, config);
    const html = ReportGenerator.generateReport(result.lhr, "html"); // HTML出力する
    console.info("Save report ...");

    fs.writeFileSync(`report/report-${md5(url).substr(0,5)}-${timestamp("YYYYMMDDmmss")}.html`, html);
  }


  await browser.close();
};

main().catch(console.error);