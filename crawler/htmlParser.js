var xpath = require('xpath'), 
dom = require('xmldom').DOMParser,
assert = require('chai').assert;


class HtmlParser {
    constructor(htmlRaw) { //option to pass http instead
        this.doc = new dom({errorHandler: {
            warning: (msg) => {}, //ignore parsing errors, it spams the log
            error: (msg) => {},
            fatalError: (msg) => {},
         }}).parseFromString(htmlRaw);
    }
    
    selectNodes(xPathArr) {
        var doc = this.doc;
        if (typeof xPathArr == 'string')
            xPathArr = [xPathArr];

        var results = xPathArr.map(query => xpath.select(query, doc));
        results = results.reduce((results, entry) => results.concat(entry), []);

        return results; 
    }

    selectContents(xPathArr) {
        return this.selectNodes(xPathArr).map(x => x.textContent);
    }

    selectContentSingle(xPathArr) { 
        var r = this.selectContents(xPathArr);
        return this._returnSingle(r);
    }

    selectAttributes(xPathArr){
        return this.selectNodes(xPathArr).map(x => x.nodeValue);
    }

    selectAttributeSingle(xPathArr) {
        var r = this.selectAttributes(xPathArr);
        return this._returnSingle(r);
    }


    _returnSingle(results) { 
        if(results && results.length > 0) {
            return results[0];
        }

        return undefined;
    }
    

}

module.exports = HtmlParser;