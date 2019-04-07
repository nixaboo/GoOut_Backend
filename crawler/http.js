var request = require('request');
var puppeteer = require('puppeteer');

var headers = {
    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'                    
};

var http = {
    getBrowser : async function(url) {        
        const browser = await puppeteer.launch({headless: true,  executablePath: '/usr/bin/chromium-browser', args: ['--disable-dev-shm-usage']});
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'networkidle0'});
        const htmlContent = await page.content(); // serialized HTML of page DOM.
        await browser.close();  
        return htmlContent;
    },

    get : async function(url) {
        return new Promise((resolve, reject) => {
            request.get({
                headers: headers,
                "url" : url
            }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    },

    getForm : async function(url, data) {
        return new Promise((resolve, reject) => {
            request.get({ url: url, form: data, headers: headers }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    },



    postForm : async function(url, data) {
        return new Promise((resolve, reject) => {
            request.post({url: url, form: data, headers: headers }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    }
}




module.exports = http;