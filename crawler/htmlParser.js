var xpath = require('xpath')
    , dom = require('xmldom').DOMParser

class HtmlParser {
    constructor(htmlRaw) { //option to pass http instead
        this.doc = new dom({errorHandler: {
            warning: (msg) => {},
            error: (msg) => {},
            fatalError: (msg) => {},
         }}).parseFromString(htmlRaw);
    }

    selectValues(xPathArr, iterNodeFn) {
        var doc = this.doc;

        if (typeof xPathArr == 'string')
            xPathArr = [xPathArr];

        var results = xPathArr.map(query => xpath.select(query, doc));
        results = results.reduce((results, entry) => results.concat(entry), []);

        if(iterNodeFn) {
            results = results.map(x => iterNodeFn(x.nodeValue));
        }else {
            results = results.map(x => x.nodeValue);
        }

        return results.flat(); //flat is we split by something with our iterNodeFn
    }

    selectNodes(xPathArr) {
        var doc = this.doc;
        if (typeof xPathArr == 'string')
            xPathArr = [xPathArr];

        var results = xPathArr.map(query => xpath.select(query, doc));
        results = results.reduce((results, entry) => results.concat(entry), []);

        return results; //flat is we split by something with our iterNodeFn
    }

    selectValue(xPath, defaultValue, iterNodeFn) {
        var results = this.selectValues(xPath, iterNodeFn);
        if(results.length > 0)
            return results.join(""); //it can return multi line

        return defaultValue;
    }
}

module.exports = HtmlParser;