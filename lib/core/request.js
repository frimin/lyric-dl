var http = require('http')
var querystring = require('querystring')

exports.http_request = function (options, response, postData){
    var req = http.request(options, function(res) { 
        var chunklist = []
        res.on('data', (chunk) => {
            chunklist.push(chunk)
        });
        res.on('end', () => {
            var size = 0
            chunklist.forEach((e) => {
                size += e.length
            })
            var buffer = new Buffer(size)
            var pos = 0
            chunklist.forEach((e) => {
                e.copy(buffer, pos)
                pos += e.length
            })
            response(null, res, buffer.toString())
        });
    })

    req.on('error', (err) => {
        console.error(err.message)
        response(err.message, null, null)
    })

    if (postData) {
        req.write(postData)
    }

    req.end()
}