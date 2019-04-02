var moment = require('moment');

function regexMatch(regex) {
    return (value) => {
        if(value && regex) {
            var match = value.match(/\d+\.\d+\.\d+/);
            if(match.length > 0)
                return match[0];
        }

        return '';
    }
}


function parseDate(format){
    return (value) => {
        if(value && format) {
            return moment(value, format);
        }
    }
}


function regexReplace(regex, replaceWith = ''){
    return (value) => {
        if(value && regex){
            return value.replace(regex, replaceWith);
        }
    }
}


module.exports = {
    regexMatch : regexMatch,
    regexReplace : regexReplace,
    parseDate : parseDate
}