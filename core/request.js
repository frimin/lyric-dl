var http = require('http')
var querystring = require('querystring')

module.exports = function (options, response){
    var req = http.request( {
    }, function(res) { 
        var chunklist = []
        res.on('data', (chunk) => {
            chunklist.push(chunk)
        });
        res.on('end', () => {
            response(res, chunklist.join())
        });
    })
    req.write(postData);
    req.end();
}