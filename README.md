# pdf-puppeteer-lambda

This service provides an AWS Lambda function to convert HTML and its resources to a PDF using Puppeteer and a headless Chromium instance. It's designed to receive files as multipart/form-data and generate a PDF based on the provided HTML and resources.

## Features

- Convert HTML documents to PDF.
- Include images and styles in the PDF by uploading related resources.
- Customize PDF output through query parameters, such as page size, margins, and scaling.

## Usage

To generate a PDF, you need to send a POST request with your HTML file and any associated resources like images or stylesheets.

### Using `curl` to Generate a PDF

Below is an example of how to use `curl` to send local files as multipart/form-data:

```bash
curl -v -X POST \
    -H "Content-Type: multipart/form-data" \
    -F "index.html=@/path/to/your/payload/index.html" \
    -F "image=@/path/to/your/payload/lena_color.gif" \
    "https://h9eg1xua6c.execute-api.eu-west-1.amazonaws.com/default/pdfPuppeteer?scale=1.1&margin=0.2" \
    -o output.pdf
```

Replace `/path/to/your/payload/` with the actual path to your HTML and image files.

### Response

The service will return a `PDF` file generated from the HTML content. The `curl` command uses the `-o` argument to output the result to a file named `output.pdf`.

### Query Parameters

- `scale`: Adjust the scale of the webpage rendering. Defaults to 1 if not specified.
- `margin`: Set the margin around the page. Use individual `marginTop`, `marginRight`, `marginBottom`, `marginLeft` for specific margins.
- `format`: Specify page format like `A4`, `Letter`, etc.

Please note that the query parameters are optional and have default values if not provided.
