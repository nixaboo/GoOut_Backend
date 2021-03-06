var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');
var rx = require('../crawler/regex');
var cu = require('../crawler/crawlerUtils');

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
    var link = htmlParser.selectAttributeSingle('//a[contains(@class,"btn-order")]/@href');
    var bgImage = htmlParser.selectAttributeSingle('//img[contains(@id,"ctl00_ContentPlaceHolder1_Image3")]/@src');
    //console.log('processBuyButton :' +  link + '/' + bgImage);
    if(link != undefined){
        taskPool.addTask(new Task("proccessBuyTicketsPage",proccessBuyTicketsPage, {url : config.urls.SHOW_LISTING + link, bgImage: bgImage}));   
    }
}

async function proccessBuyTicketsPage(taskPool, options) {
    //console.log('proccessBuyTicketsPage: ' + options.url);   
    var html =  new HtmlParser(await http.get(options.url));    
    var fields = {
        site: 'barby.co.il',
        date : [cu.content('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblDate")]'), rx.match.date('/'), fh.parseDate("DD/MM/YY")],
        time: [cu.content('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblDate")]'), rx.match.time()],                        
        location: 'בארבי תא',
        title: [cu.content('//span[contains(@id, "ctl00_ContentPlaceHolder1_ShowName")]'), rx.replace.removeNewLineAndTab(), fh.trim()],
        image: options.bgImage,
        price : [cu.content('//span[contains(@id, "ctl00_ContentPlaceHolder1_lblPrice")]'), rx.match.number()],
        url : options.url        
    };
    
        
    cu.resolveFields(fields, html);
    var print = ['site', 'date', 'price', 'time', 'location', 'title', 'image', 'url'];
    print = print.map(x => fields[x] ? fields[x].toString() : '');
    console.log(print.join(','));    
}



module.exports = new Task("barbyTask", entry);