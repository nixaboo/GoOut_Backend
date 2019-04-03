var fh = require('./fieldHelpers');
var regex = {
    match : {
        date : function (delimiter = '.') { 
            var d = delimiter;                                  
            var r = new RegExp(`\\d+\\${d}\\d+\\${d}\\d+`);
            return fh.regexMatch(r); 
        },

        imageUrl : function() { 
            return fh.regexMatch(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/);
        }
    },

    replace : {
        removeSpaces : function() {
            return fh.regexReplace(/[\r\n\t]/g);
        }
    }
}


module.exports = regex;