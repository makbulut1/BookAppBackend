const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function test() {
    console.log('Reading file...');
    const dataBuffer = fs.readFileSync('./public/uploads/outlier-analysis.pdf');

    console.log('File size:', dataBuffer.length);

    const pageTexts = [];

    try {
        console.log('Parsing with new PDFParse and pagerender (destructured)...');
        //const PDFParse = pdf.PDFParse;

        const options = {
            data: dataBuffer,
            pagerender: async (pageData) => {
                console.log('Pagerender called!');
                const textContent = await pageData.getTextContent();
                let lastY, text = '';
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    }
                    else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }
                return text;
            }
        };

        const parser = new PDFParse(options);
        const data = await parser.getText();
        console.log('Success!');
        const info = await parser.getInfo();
        console.log('Info keys:', Object.keys(info));
        console.log('Title:', info.title);
        console.log('Pages array length:', data.pages ? data.pages.length : 'undefined');
        if (data.pages && data.pages.length > 0) {
            console.log('Page 1 Type:', typeof data.pages[0]);
            console.log('Page 1 keys:', Object.keys(data.pages[0]));
            if (data.pages[0].text) {
                console.log('Page 1 Text Preview:', data.pages[0].text.substring(0, 100));
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
