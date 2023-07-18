import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import Busboy from "busboy";
import path from 'path';

export const handler = async (event) => {
    let browser = null;

    try {
        const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
        const headers = event.headers;

        const busboy = Busboy({
            headers: {
                'content-type': headers['content-type'] || headers['Content-Type'],
            },
        });

        let resources = {};

        const onData = new Promise((resolve, reject) => {
            busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
                if(!resources[fieldname]) {
                    resources[fieldname] = {
                        data: [],
                        mimetype: mimetype
                    };
                }
                file.on('data', data => {
                    resources[fieldname].data.push(data);
                });
                file.on('end', () => {
                    resources[fieldname].content = Buffer.concat(resources[fieldname].data);
                });
            });
            busboy.on('finish', resolve);
            busboy.on('error', reject);
        });
    
        busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
        busboy.end();
    
        await onData;

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

        const root = process.env.LAMBDA_TASK_ROOT;
        const blankHtmlPath = path.join(root, "empty.html");

        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            const url = new URL(interceptedRequest.url()); // Create URL object
        
            if (url.protocol === 'file:' && url.pathname !== blankHtmlPath) {
                const resourceName = path.basename(url.pathname); // Extract the file name
                const resource = resources[resourceName];
                if (resource) {
                    interceptedRequest.respond({
                        status: 200,
                        contentType: resource.mimetype,
                        body: resource.content,
                    });
                } else {
                    interceptedRequest.abort();
                }
            } else {
                interceptedRequest.continue();
            }
        });

        // Set page content
        if (resources["index.html"]) {
            const html = resources["index.html"].content.toString();
            // see https://github.com/puppeteer/puppeteer/issues/728
            await page.goto(`file://${blankHtmlPath}`, { waitUntil: 'load' });
            await page.setContent(html, { waitUntil: 'networkidle0' });
            // see https://github.com/puppeteer/puppeteer/issues/4526
            //await page.goto(`data:text/html,${html}`, { waitUntil: 'networkidle0' });
        } else {
            throw new Error("Missing index.html in the request");
        }

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
