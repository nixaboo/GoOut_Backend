var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');
var rx = require('../crawler/regex');
var cu = require('../crawler/crawlerUtils');

var config = {
    urls : {
        SHOW_LISTING : 'https://www.clipa.co.il/%D7%9C%D7%95%D7%97-%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/',
        GET_SHOW_FRAME_AJAX : 'https://www.clipa.co.il/wp-admin/admin-ajax.php'
    }
}

async function entry(taskPool, options) {
    var raw = await http.get(config.urls.SHOW_LISTING);
    var htmlParser =  new HtmlParser(raw);
        
    var results = htmlParser.selectAttributes('//div[@class="details"]/@data-tickets').map((x) => x.split(',')).flat();

    //results = results.splice(1, 3);
    results.forEach(showId => {
        var task = new Task("clipa_fetchAjaxFrame", fetchAjaxFrame, {showId : showId});
        taskPool.addTask(task);
    });

    return true;
}

async function fetchAjaxFrame(taskPool, options) {
    //console.log(options.showId);
    var httpResult = await http.postForm(config.urls.GET_SHOW_FRAME_AJAX, {action: 'show_tickets', ticketsList: options.showId});
    taskPool.addTask(new Task("processPage",processPage, {body : httpResult}));
}

async function processPage(taskPool, options) {
    //console.log('processPage');   
    
    options.url = 'https://www.clipa.co.il/product/%d7%97%d7%9c%d7%95%d7%9d-%d7%9c%d7%99%d7%9c-%d7%a7%d7%99%d7%a5-%d7%91%d7%97%d7%9c%d7%9c-25-05-19_20-30/';    
    var html =  new HtmlParser(options.body || await http.getBrowser(options.url));    

    var links = html.selectAttributes(['//*[@class="ticket-link"]/a/@href', '//a[@class="read-more"]/@href']);
    links.forEach((link) => {
        taskPool.addTask(new Task("processPage", processPage, {url : link}));
    });

    var prods = html.selectNodes('//div[contains(@class, "prod-details")]');    

    if(prods.length > 0) {
        var liXPath = (text) => `//li[span[contains(text(),"${text}")]]`;

        var fields = {
            site: 'clipa.co.il',
            date : [cu.content(liXPath('תאריך')), rx.match.date('.'), fh.parseDate("DD.MM.YY")],
            price : [cu.content(liXPath('מחיר')), rx.match.number()],
            time: [cu.content(liXPath('שעה')), rx.replace.removeNewLineAndTab()],                        
            location: [cu.content(liXPath('מיקום')), rx.replace.removeNewLineAndTab()],
            title: [cu.content('//*[contains(@class, "section-title")]/text()'), rx.replace.removeNewLineAndTab()],
            image: [cu.content('//div[contains(@class, "bg-image")]/@style'), rx.match.imageUrl()],
            url : options.url
        };
     
        
        cu.resolveFields(fields, html);        
        var print = ['site', 'date', 'price', 'time', 'location', 'title', 'image', 'url'];
        print = print.map(x => fields[x] ? fields[x].toString() : '');
        console.log(print.join(','));
    }
}



module.exports = new Task("clipaTask", entry);