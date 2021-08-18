const fs = require("fs");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator");
const timestamp = require('time-stamp');
const csvSync = require('csv-parse/lib/sync');
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
  throw result.error
}

const flags = {
  logLevel: "error", // or silent|error|info|debug
  emulatedUserAgent: process.env.UA,
  port: process.env.PORT, // puppeteerで利用するブラウザと同じPORTを利用することで、sessionが継続される
  disableStorageReset: true,
};

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

// const selector = {
//   class(attribute, className) {
//     return `${attribute}[class='${className}']`
//   },
//   type(attribute, value) {
//     return `${attribute}[type='${value}']`
//   },
//   id(value) {
//     return `#${value}`
//   }
// }

const createReport = async (urls, dirname) => {

  if (!fs.existsSync(dirname)) {
    console.info("Create report dir ...");
    fs.mkdir(dirname, {
      recursive: true
    }, (err) => {
      if (err) throw err;
    });
  }

  counter = 1;
  for (const url of urls) {

    console.info(`Access to ${url} ...`);
    const result = await lighthouse(url, flags, config);
    const report = await ReportGenerator.generateReport(result.lhr, process.env.REPORT_FORMAT); // html | json | csv
    console.info("Save report ...");
    // 数値はゼロ埋め
    fs.writeFileSync(`${dirname}/report-${('000'+counter).slice(-4)}.${process.env.REPORT_FORMAT}`, report);
    counter++;
  }
}

const getUrls = async () => {
  if (!fs.existsSync(process.env.URL_FILE)) {
    console.info(`Not found ${process.env.URL_FILE}`);
    if (err) throw err;
  }

  obj = await fs.promises.readFile(process.env.URL_FILE, 'utf-8');
  res = csvSync(obj, {
    columns: true
  });

  loginUrls = []
  noLoginUrls = []
  res.forEach(e => {
    if (e.doLogin == "true") {
      loginUrls.push(e.url);
    } else {
      noLoginUrls.push(e.url);
    }
  });

  return {
    loginUrls,
    noLoginUrls
  }
}

// const login = async () => {
// console.info("Now login ...");

// await page.goto(LOGIN_URL);
// await page.type(selector.id('GsUserEmail'), USERNAME);
// await page.type(selector.id('GsUserPassword'), PASSWORD);
// await Promise.all([page.click(selector.type('button', 'submit')), page.waitForNavigation()]);
// }

const main = async () => {

  urls = await getUrls();
  console.debug(urls)

  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${process.env.PORT}`],
    headless: true,
  });
  const page = await browser.newPage();
  
  now = timestamp("YYYYMMDDHHmmss")
  dir = `report/${now}/NoLogin`;
  await createReport(urls.noLoginUrls, dir);
  // await page.close(); 

  console.info("Now login ...");
  await page.goto(process.env.LOGIN_URL);
  await page.type(process.env.ID_SELECTOR, process.env.USERNAME);
  await page.type(process.env.PASSWORD_SELECTOR, process.env.PASSWORD);
  await Promise.all([page.click(process.env.SUBMIT_SELECTOR), page.waitForNavigation()]);
  // await page.close(); 

  dir = `report/${now}/Login`;
  await createReport(urls.loginUrls, dir);
  // await page.close(); 

  await browser.close();
};

main().catch(console.error);