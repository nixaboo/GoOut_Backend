const assert = require('chai').assert;
var methods = {    
    resolveFields : function(fields, htmlParser) {
        for(var key in fields){
            if(typeof fields[key]  === 'string')
                continue;
                
            fields[key] = fields[key].reduce((value, entity) => { return entity(value, htmlParser); }, '');
        }

        return fields;
    },

    attribute : function(xpath) { 
        return (value, htmlParser) => { 
            assert.isNotNull(htmlParser);
            return htmlParser.selectAttributeSingle(xpath);
        }
    },

    content : function(xpath) { 
        return (value, htmlParser) => { 
            assert.isNotNull(htmlParser);
            
            return htmlParser.selectContentSingle(xpath);
        }
    }
}

module.exports = methods;