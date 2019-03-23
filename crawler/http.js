var request = require('request');

var http = {
    get : async function(url, data) {
        return new Promise((resolve, reject) => {
            request.get(url, data, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    },

    getForm : async function(url, data) {
        return new Promise((resolve, reject) => {
            request.get(url, { form: data }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    },



    postForm : async function(url, data) {
        return new Promise((resolve, reject) => {
            request.post(url, { form: data }, (error, res, body) => {
                if(error)
                    reject();

                resolve(body);
            })
        });
    }
}




module.exports = http;