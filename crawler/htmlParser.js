var xpath = require('xpath')
    , dom = require('xmldom').DOMParser

class HtmlParser {
    constructor(htmlRaw) { //option to pass http instead
        this.doc = new dom().parseFromString(htmlRaw);
    }

    selectValues(xPathArr, iterNodeFn) {
        var doc = this.doc;
        var results = xPathArr.map(query => xpath.select(query, doc));
        results = results.reduce((results, entry) => results.concat(entry), []);

        if(iterNodeFn) {
            results = results.map(x => iterNodeFn(x.value));
        }

        return results.flat(); //flat is we split by something with our iterNodeFn
    }
}

module.exports = HtmlParser;