var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');
var rx = require('../crawler/regex');

var config = {
    urls : {
        SHOW_LISTING : 'https://www.clipa.co.il/%D7%9C%D7%95%D7%97-%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/',
        GET_SHOW_FRAME_AJAX : 'https://www.clipa.co.il/wp-admin/admin-ajax.php'
    }
}

async function entry(taskPool, options) {
    var raw = await http.get(config.urls.SHOW_LISTING);
    var htmlParser =  new HtmlParser(raw);
    var results = htmlParser.selectValues(['//div[@class="details"]/@data-tickets'], (x) => x.split(','));

    results = results.splice(1, 3);
    results.forEach(showId => {
        var task = new Task("clipa_fetchAjaxFrame", fetchAjaxFrame, {showId : showId});
        taskPool.addTask(task);
    });

    return true;
}

async function fetchAjaxFrame(taskPool, options) {
    console.log(options.showId);
    var httpResult = await http.postForm(config.urls.GET_SHOW_FRAME_AJAX, {action: 'show_tickets', ticketsList: options.showId});
    taskPool.addTask(new Task("processPage",processPage, {body : httpResult}));
}

async function processPage(taskPool, options) {
    console.log('processPage');   
    var html =  new HtmlParser(options.body || await http.get(options.url));

    var links = html.selectValues(['//*[@class="ticket-link"]/a/@href', '//a[@class="read-more"]/@href']);
    links.forEach((link) => {
        taskPool.addTask(new Task("processPage", processPage, {url : link}));
    });

    var prods = html.selectNodes('//div[contains(@class, "prod-details")]');    

    if(prods.length > 0) {
        var liXPath = (text, selector = '/text()') => `//li[span[contains(text(),"${text}")]]${selector}`;
        var selectValue = (xpath, defaultValue = '') => (() => html.selectValue(xpath, ''));
        var selectTextContent = (xpath, defaultValue = '') => (() => html.selectTextContentValue(xpath, defaultValue));

        var fields = {
            date : [selectValue(liXPath('תאריך')), rx.match.date('.'), fh.parseDate("DD.MM.YY")],
            price : [selectTextContent(liXPath('מחיר', '')), rx.match.number()],
            time: [selectValue(liXPath('שעה')), rx.replace.removeNewLineAndTab()],                        
            location: [selectValue(liXPath('מיקום')), rx.replace.removeNewLineAndTab()],
            title: [selectValue('//*[contains(@class, "section-title")]/text()'), rx.replace.removeNewLineAndTab()],
            image: [selectValue('//div[contains(@class, "bg-image")]/@style'), rx.match.imageUrl()]            
        };
     
        
        var x = fh.resolveFieldMethods(fields);        
        console.log(JSON.stringify(x));
    }
}



module.exports = new Task("clipaTask", entry);