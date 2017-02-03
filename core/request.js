var http = require('http')
var querystring = require('querystring')

exports.http_request = function (options, response, postData){
    var req = http.request(options, function(res) { 
        var chunklist = []
        res.on('data', (chunk) => {
            chunklist.push(chunk)
        });
        res.on('end', () => {
            response(res, chunklist.join(''))
        });
    })
    if (postData) {
        req.write(postData)
    }
    req.end();
}