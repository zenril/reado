const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

exports.puppeteer = () => {
    const browser = puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
    });

    return async (url, contentMap = {}, linkMap = {}) => {
        const pages = await browser.pages();
        const page = pages[0];

        await page.goto(url, { waitUntil: "networkidle2" });

        const html = await page.evaluate(
            (linkMap, contentMap) => {
                let extractedHrefs = {};
                let extractedContents = {};

                let linkKeys = Object.keys(linkMap);
                for (const key of linkKeys) {
                    extractedHrefs[key] = document.querySelector(
                        linkMap[key]
                    ).href;
                }

                let contentKeys = Object.keys(contentMap);
                for (const key of contentKeys) {
                    let content = document
                        .querySelector(contentMap[key])
                        .outerHTML.replace(/style="[^"]*"/g, "")
                        .replace(/<br>|<br\/>/g, "");
                    extractedContents[key] = content;
                }

                return {
                    extractedContents,
                    extractedHrefs,
                };
            },
            linkMap,
            contentMap
        );

        await page.close();
        await browser.close();
        return html;
    };
};
