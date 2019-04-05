var moment = require('moment');
const assert = require('chai').assert;

var methods = {
     regexMatch: function(regex) {
        return (value) => {   
            assert.isNotNull(regex);         

            if(value && regex) {
                var match = value.match(regex);
                if(match && match.length > 0)
                    return match[0];
            }
    
            return '';
        }
    },
        
    parseDate : function(format){
        return (value) => {
            assert.isNotNull(format);

            if(value && format) {
                return moment(value, format);
            }
        }
    },
        
    regexReplace : function(regex, replaceWith = ''){
        return (value) => {
            assert.isNotNull(regex);
            
            if(value && regex){
                return value.replace(regex, replaceWith);
            }
        }
    }
}

module.exports = methods;