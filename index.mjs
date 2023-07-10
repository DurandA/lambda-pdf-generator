import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const handler = async (event) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--disable-gpu',
                '--single-process',
                '--disable-web-security',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        await page.setContent(`<h1>Your awesome PDF report template</h1>`);

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 20, left: 20, right: 20, bottom: 20 },
            displayHeaderFooter: true
        });

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=test.pdf",
            },
            body: pdf.toString('base64'),
            isBase64Encoded: true
        };
    } catch(error) {
        console.log('Error: ', error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}
