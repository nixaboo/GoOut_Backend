var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');


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

function field(htmlText, target, onEnd = []) {
    return {htmlText: htmlText,
        target: target,
        onEnd: (Array.isArray(onEnd) ? onEnd : [onEnd])}
};

async function processPage(taskPool, options) {
    console.log('processPage');
    var httpBody = options.body || await http.get(options.url);
    var html =  new HtmlParser(httpBody);

    var links = html.selectValues(['//*[@class="ticket-link"]/a/@href', '//a[@class="read-more"]/@href']);	//multi select
    links.forEach((link) => {
        taskPool.addTask(new Task("processPage", processPage, {url : link}));
    });

    var prods = html.selectNodes('//div[contains(@class, "prod-details")]');

    if(prods.length > 0) {

        var fields = [field('תאריך', 'date',  [fh.regexMatch(/\d+\.\d+\.\d+/),
                                                                    fh.parseDate("DD.MM.YY")]),
            field('שעה', 'time', fh.regexReplace(/[\r\n\t]/g)),
            field('מיקום', 'location', fh.regexReplace(/[\r\n\t]/g))];

        var ret = {};
        fields.forEach(field => {
            var xpath = `//li[span[contains(text(),"${field.htmlText}")]]/text()`;
            var value = html.selectValue(xpath, '');

            field.onEnd.forEach(fn => value = fn(value));
            ret[field.target] = value;
        })
    }
}



module.exports = new Task("clipaTask", entry);