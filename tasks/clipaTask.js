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

    results = results.splice(1, 1);
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

    var liXPath = (text) => `//li[span[contains(text(),"${text}")]]/text()`;
    if(prods.length > 0) {

        var fields = [{xpath: liXPath('תאריך'), target: 'date', onEnd: [fh.regexMatch(/\d+\.\d+\.\d+/), fh.parseDate("DD.MM.YY")]},
                      {xpath: liXPath('שעה'), target: 'time', onEnd: [fh.regexReplace(/[\r\n\t]/g)]},
                      {xpath: liXPath('מיקום'), target: 'location', onEnd: [fh.regexReplace(/[\r\n\t]/g)]},
                      {xpath: '//*[contains(@class, "section-title")]/text()', target: 'title', onEnd: [fh.regexReplace(/[\r\n\t]/g)]},
                      //{xpath: '//div[contains(@class, "single-right")]', target: 'desc', onEnd: [fh.regexReplace(/[\r\n\t]/g)]},
                      {xpath: '//div[contains(@class, "bg-image")]/@style', target: 'image', onEnd: [fh.regexMatch(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/)]}];


        // values.title = parsed.findAll(undefined, 'section-title')[0].getText().replace(/[\r\n\t]/g, '');
        // values.desc = parsed.findAll('div', ['col-md-6','col-sm-6','col-xs-12','single-right'])[0].prettify();
        // var bgImage = parsed.findAll('div', 'bg-image')[0];
        // values.image = bgImage.attrs.style.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/)[0];

        var ret = {};
        fields.forEach(field => {
            var value = html.selectValue(field.xpath, '');
            field.onEnd.forEach(fn => value = fn(value));
            ret[field.target] = value;
        })
    }
}



module.exports = new Task("clipaTask", entry);