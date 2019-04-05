var moment = require('moment');

function regexMatch(regex) {
    return (value) => {
        if(value && regex) {
            var match = value.match(regex);
            if(match && match.length > 0)
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

function resolveFieldMethods(fields){
    for(var key in fields){
        if(typeof fields[key]  === 'string')
            continue;
            
        fields[key] = fields[key].reduce((value, entity) => { return entity(value); }, '');
    }

    return fields;
}

module.exports = {
    regexMatch : regexMatch,
    regexReplace : regexReplace,
    parseDate : parseDate,
    resolveFieldMethods : resolveFieldMethods
}