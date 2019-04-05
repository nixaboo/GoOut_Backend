var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');
var rx = require('../crawler/regex');

var config = {
    urls : {
        SHOW_LISTING : 'https://www.barby.co.il/'
    }
}

async function entry(taskPool, options) {
    var raw = await http.get(config.urls.SHOW_LISTING);
    var htmlParser =  new HtmlParser(raw);
    var links = htmlParser.selectAttributes(['//div[@class="defShowListMain"]/a/@href']);
    links.length = 1;
    links.forEach(url => {        
        //console.log(url);
        taskPool.addTask(new Task("processBuyButton", processBuyButton, {url : config.urls.SHOW_LISTING + url}));
    });

    return true;
}

async function processBuyButton(taskPool, options) {
    //console.log(options.url);
    var htmlParser = new HtmlParser(await http.get(options.url));    
    var link = htmlParser.selectValue('//a[contains(@class,"btn-order")]/@href');
    var bgImage = htmlParser.selectValue('//img[contains(@id,"ctl00_ContentPlaceHolder1_Image3")]/@src');
    //console.log('processBuyButton :' +  link + '/' + bgImage);
        
    taskPool.addTask(new Task("proccessBuyTicketsPage",proccessBuyTicketsPage, {url : config.urls.SHOW_LISTING + link, bgImage: bgImage}));   
}

async function proccessBuyTicketsPage(taskPool, options) {
    //console.log('proccessBuyTicketsPage: ' + options.url);   
    var html =  new HtmlParser(await http.get(options.url));
    var selectValue = (xpath, defaultValue = '') => (() => html.selectValue(xpath, ''));
    var fields = {
        date : [selectValue('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblDate")]/text()'), rx.match.date('/'), fh.parseDate("DD/MM/YY")],
        time: [selectValue('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblDate")]/text()'), rx.match.time()],                        
        location: 'בארבי תא',
        title: [selectValue('//span[contains(@id, "ctl00_ContentPlaceHolder1_ShowName")]/text()'), rx.replace.removeNewLineAndTab()],
        image: options.bgImage,
        price : [selectValue('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblPrice")]/text()'), rx.match.number()],       
        
    };
    
    
    var x = fh.resolveFieldMethods(fields);
    console.log(JSON.stringify(x));
}



module.exports = new Task("clipaTask", entry);