var common = require(phantom.libraryPath + '/core/common.js')

function parseGET(url){
	var query = url.substr(url.indexOf("?")+1);
	var result = {};
	query.split("&").forEach(function(part) {
		var e = part.indexOf("=")
		var key = part.substr(0, e);
		var value = part.substr(e+1);
		result[key] = decodeURIComponent(value);
	});
	return result;
}

exports.handler = function (opt) {
    var server = require('webserver').create()

    var port = parseInt(opt['p'] || opt['port'] || 8080)
    var host = (opt['h'] || opt['host'] || '127.0.0.1') + ':' + port
    
    var service = server.listen(host, function(request, response) {
		var query = parseGET(request.url)

		function make_response(content) {
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.write(content);
			response.close();
		}

        var act = query['act']

        switch(act)
        {
            case 'id':
                var loader = loadersets[query['s']]
                var song_id = query['id']

                if (!loader || !song_id) {
                    make_response(JSON.stringify(common.makeFailedData('invalid args')))
                    return
                }

                loader.downloadLyric(song_id, function (result) {
                    make_response(JSON.stringify(result))
                })

                break
            default:
                make_response(JSON.stringify(common.makeFailedData()))
                break
        }
	})

	if (service) {
		console.log('server started - http://' + host)
	} else {
		console.log('error: failed to start server, ' + host)
        phantom.exit(2)
	}
}