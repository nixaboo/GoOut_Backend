var request = require('request');
var jssoup = require('jssoup').default;
var fs = require('fs');
var moment = require('moment');
global.Promise=require("bluebird");

const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    host: "localhost",
    database: 'goout',
    username: 'root',
    password: '123456',
    dialect: 'mysql'
});



function asyncMethod (instance, methodList) {
    methodList.forEach(entry => {

    });
}
const User = sequelize.define('user', {
    username: Sequelize.STRING,
    birthday: Sequelize.DATE
});


async function doStuff() {
    try {
        await sequelize.sync();
/*
        var jane = await User.create({
            username: 'janedoe',
            birthday: new Date(1980, 6, 20)
        });
*/

        var a = await User.findOne({where : {username : 'janedoe'}});
        await a.update({username : 'alon2'});
    }
    catch(e) {
        console.log(e);
    }
}

//doStuff();


//Create async-pool

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
            return flat.concat((Array.isArray(toFlatten) && (depth-1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
    }
});

var testUrl = 'https://www.clipa.co.il/%D7%9C%D7%95%D7%97-%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/';

//https://www.clipa.co.il/%D7%9C%D7%95%D7%97-%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/?catID=-1&clipaMonth=04&clipaYear=2019

async function httpGet(url, data) {
    return new Promise((resolve, reject) => {
        request.get(url, { form: data }, (error, res, body) => {
            if(error)
                reject();

            resolve(body);
        })
    });
}

async function httpFormPost(url, data) {
    return new Promise((resolve, reject) => {
        request.post(url, { form: data }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
}


//request(testUrl, function (error, response, body) {
async function testClipa() {
    //console.log('error:', error); // Print the error if one occurred
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    //console.log('body:', body); // Print the HTML for the Google homepage.
    var body = fs.readFileSync('clipa_root.html');
    var parsed = new jssoup(body);

    var allShowDivs = parsed.findAll('div', 'details');
    var showsData = allShowDivs.map(showDiv => {
        var idsInDiv = showDiv.attrs['data-tickets'].split(',');
        var showRows =  showDiv.findAll('div', 'showRow');
        var currIndex = 0;
        var ret = [];
        showRows.forEach(showRow => {
            var show = {
                id : idsInDiv[currIndex]
                //time : showRow.findAll('span', 'showTime')[0].getText(),
                //title : showRow.findAll('span', 'showTitle')[0].getText(),
                //type : showRow.findAll('span', 'showCat')[0].getText(),
            }

            ret.push(show);
            currIndex++;
        });

        return ret;
    }).flat();

    //showsData.length = 1;
    //showsData[0].id = 7885;

    showsData = await Promise.map(showsData, async function fetchShowFrame(show) {
        if(!show.entries)
            show.entries = [];

        async function processPage(options, depth){
            console.log('enter processPage --> ' + depth);
            if(depth == 10) {
                //something is wrong
                throw new Error('Got to depth-level 10');
            }

            var httpBody = options.body || await httpGet(options.url);

            var parsed = new jssoup(httpBody);
            var ticketLink = parsed.findAll(undefined, 'ticket-link');
            var readMore = parsed.findAll('a', 'read-more');
            var prodDetails = parsed.findAll('div', 'prod-details');


            await Promise.each(ticketLink, async entry => {
                var url = entry.findAll('a')[0].attrs['href'];
                await processPage({url : url}, depth+1);
            });

            await Promise.each(readMore, async entry => {
                await processPage({url : entry.attrs['href']}, depth+1);
            });

            //if we have prod-details we insert an entry into the showsAdded
            prodDetails.forEach(detailsEntry => {
                var liList = detailsEntry.findAll('li');
                //function resolveValue(liList, 'תאריך')

                //values.time = resolveValue(liList, 'תאריך');
                function resolveValue(lookupText, specificSelector) {
                    var list = liList.filter(li => {
                            if(li.contents.length > 0 &&
                                li.contents[0].contents &&
                                li.contents[0].contents.length > 0 &&
                                li.contents[0].contents[0]._text)
                                return li.contents[0].contents[0]._text.indexOf(lookupText) >= 0
                            return false;
                        });
                    if(list.length == 0)
                        return '';

                    if(specificSelector)
                        return specificSelector(list[0]);

                    return list[0].contents[1]._text.replace(/[\r\n\t]/g, '');
                }

                var values = {};
                var dateStr = resolveValue( 'תאריך:').match(/\d+\.\d+\.\d+/)[0];
                values.date = moment(dateStr, "DD.MM.YY");
                values.time = resolveValue( 'שעה:');
                values.location = resolveValue( 'מיקום:');
                //first try to find a span with a price --> if its not there its in a <form class="variations_form cart"
                values.price = resolveValue( 'מחיר:', (li) => {
                    var list = li.findAll('span', 'woocommerce-Price-amount');
                    if(list.length > 0 && list[0].contents[0]._text)
                        return list[0].contents[0]._text.match(/[0-9,]+/)[0].replace(/,/g, '');
                    return '';
                });

                function getPriceFromVariationForm() {
                    var formList = parsed.findAll('form', ['variations_form', 'cart']);
                    if(formList.length == 0)
                        return '';

                    var formHtml = formList[0].prettify();
                    var split = formHtml.split('woocommerce-Price-amount');
                    if(split.length <= 1)
                        return '';

                    var regex = /\d+\.\d+/;
                    var match = regex.exec(split[1]);
                    if(match.length > 0)
                        return match[0];

                    return '';
                }
                if(values.price == '') {
                    values.price = getPriceFromVariationForm();
                }

                values.title = parsed.findAll(undefined, 'section-title')[0].getText().replace(/[\r\n\t]/g, '');
                values.desc = parsed.findAll('div', ['col-md-6','col-sm-6','col-xs-12','single-right'])[0].prettify();
                var bgImage = parsed.findAll('div', 'bg-image')[0];
                values.image = bgImage.attrs.style.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/)[0];

                //  Work on how we match URLs for images later
                show.entries.push(values);
            });


            console.log('exit processPage --> ' + depth);

        }
        var httpResult = await httpFormPost('https://www.clipa.co.il/wp-admin/admin-ajax.php', {action: 'show_tickets', ticketsList: show.id});
        await processPage({body: httpResult}, 1);
        //Check for ticket-link or read-more if present go to it

        /*var buyData = await httpGet(urlBuyInfo);
        var parseBuy = new jssoup(buyData);

        //if we get prod-details its an actual showing and we can read the data

        var prodContent = parseBuy.findAll('div', 'prod-content');
        var prodDetails = prodContent[0].findAll('div', 'prod-details');
        //Title we get from: class="section-title"
        //Text we get from: class="single-right"

        var liList = prodDetails[0].findAll('li');
        function resolveValue(liList, 'תאריך')

        //values.time = resolveValue(liList, 'תאריך');
        var values = liList.map(li => {
            if(li.contents.length >= 2 && li.contents[1]._text )
                return li.contents[1]._text.replace(/[\r\n\t]/g, '')
            else
                return null;
        });

        showsData.location = values[3];
        showsData.price = values[4];
        return showsData;*/
        return show;
    }, {concurrency : 3});

    console.log('Done!');

    //var results = await httpPost('https://www.clipa.co.il/wp-admin/admin-ajax.php', {action: 'show_tickets', ticketsList: showIds[0]});*/

    /*var all = parsed.findAll('div', 'details');
    var showIds = all.map((x) => x.attrs['data-tickets'].split(',')).flat();

    showIds.length = 1;

    var basUrl = 'https://www.clipa.co.il/wp-admin/admin-ajax.php';
    var p =    Promise.map(showIds, async showId => {
        return await httpPost(basUrl, {action: 'show_tickets', ticketsList: showId});
    }, {concurrency : 2});

    var results = await httpPost('https://www.clipa.co.il/wp-admin/admin-ajax.php', {action: 'show_tickets', ticketsList: showIds[0]});*/
    //var getShowInfo = showIds.map()
};

testClipa();
