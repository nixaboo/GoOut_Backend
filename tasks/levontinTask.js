var Task = require('../crawler/task');
var http = require('../crawler/http');
var HtmlParser = require('../crawler/htmlParser');
var fh = require('../crawler/fieldHelpers');
var rx = require('../crawler/regex');
var cu = require('../crawler/crawlerUtils');
var moment = require('moment');

var config = {
    urls : {
        SHOW_LISTING : 'http://www.levontin7.com/?rhc_action=get_calendar_events&post_type=events',        
    }
}

async function entry(taskPool, options) {
    var start = moment().subtract('1', 'month').endOf('month');
    var end = moment().endOf('month');
    var now = moment();
    //start=1553979600&end=1557003600&_=1554656733772&url=http%3A%2F%2Fwww.levontin7.com%2F%3Frhc_action%3Dget_calendar_events%26post_type%3Devents
    //start=1553979600&end=1557003600&_=1554656733772&url=http%3A%2F%2Fwww.levontin7.com%2F%3Frhc_action%3Dget_calendar_events%26post_type%3Devents
    var raw = await http.postForm(config.urls.SHOW_LISTING, {start: start.unix(), end: end.unix(),  _ : now.valueOf(), url: 'http%3A%2F%2Fwww.levontin7.com%2F%3Frhc_action%3Dget_calendar_events%26post_type%3Devents'});
    var json = JSON.parse(raw);
    json.EVENTS.forEach(show => {

        var price = 0;
        if(show.description){
            var  m  = show.description.match(/\d+/g);
            if(m) { 
                price = m[m.length - 1];
            }
        }

        var event = {
            externalId : show.id,
            title : show.title,
            image:  (show.image.length > 0 ? show.image[0] : ''),
            desc: show.description,
            url : show.url,
            date: moment(show.start, "YYYY-MM-DD HH:mm:ss"), 
            time : moment(show.start, "YYYY-MM-DD HH:mm:ss").format("hh:mm"),
            end:  moment(show.end, "YYYY-MM-DD HH:mm:ss"), 
            price : price,
            site: 'www.levontin.co.il', //we can auto shove-this 
            location : 'מועדון לבוטנין'

        };        
    });
    //results = results.splice(1, 3);    

    return true;
}


module.exports = new Task("levontinTask", entry);