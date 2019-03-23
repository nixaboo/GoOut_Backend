var Task = require('../crawler/task');
var Http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');

async function entry() {
    var testUrl = 'https://www.clipa.co.il/%D7%9C%D7%95%D7%97-%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/';
    var raw = await Http.get(testUrl);
    var htmlParser =  new HtmlParser(raw);
    var results = htmlParser.selectValues(['//div[@class="details"]/@data-tickets'], (x) => x.split(','));
    return true;
}


module.exports = new Task("clipaTask", entry);