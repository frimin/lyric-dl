// server.js

function parseGET(url){
    var result = {}

    query = url

    if (url.indexOf('?') != -1) {
        query = url.substr(url.indexOf('?')+1)
        result['_'] = url.substr(0, url.indexOf('?'))
    } else {
        result['_'] = url
    }

	query.split('&').forEach(function(part) {
		var e = part.indexOf('=')
		var key = part.substr(0, e)
		var value = part.substr(e+1)
		result[key] = decodeURIComponent(value)
	});

	return result;
}

var serverLog = common.createLog('server')

var pathHandler = {}

pathHandler['/api/url'] = function(args, response) {
    if (!args['target']) {
        return response(JSON.stringify(common.makeFailedData('invalid argument')))
    }

    var rt = commands.url.parseUrl(args['target'])

    if (!rt) {
        serverLog('invalid url : ' + args['target'])
        return response(JSON.stringify(common.makeFailedData('invalid url')))
    }

    var log = common.createLog('api download', rt.id)

    rt.loader.downloadLyric(log, rt.id, function (result) {
        response(JSON.stringify(result))
    })
}

pathHandler['/api/search'] = function(args, response) {
    if (!args['target']) {
        return response(JSON.stringify(common.makeFailedData('invalid argument')))
    }

    var loader = common.getLoader('ntes')

    var log = common.createLog('api search', args['target'])

    loader.search(log, args['target'], function (result) {
        response(JSON.stringify(result))
    })
}

exports.handler = function (opt) {
    var server = require('webserver').create()

    var port = parseInt(opt['p'] || opt['port'] || 8080)
    var host = (opt['h'] || opt['host'] || '127.0.0.1') + ':' + port
    
    var service = server.listen(host, function(request, response) {
        serverLog('request : ' + request.method + ' ' + decodeURIComponent(request.url) + ' postRaw:' + request.postRaw || '')

        if (request.method != 'POST') {
            response.statusCode = 405
            response.write("Method Not Allowed");
            response.close()
            return 
        }

		var args = parseGET(request.postRaw || '')
        var path = request.url
        
        if (request.url.indexOf('?') != -1) {
            path = request.url.substr(0, request.url.indexOf('?'))
        }

		function _response(content) { 
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.write(content);
			response.close();
		}

        var hander = pathHandler[path]

        if (!hander) {
            serverLog('not found path : ' + path)
            response.statusCode = 404
            response.write("Not Found");
            response.close()
            return 
        }

        try {
            hander(args, _response)
        } catch (e) {
            serverLog(e)
            response.statusCode = 500
            response.write("Internal Server Error");
            response.close()
            return 
        }
	})

	if (service) {
		console.log('server started - http://' + host)
	} else {
		console.log('error: failed to start server, ' + host)
        phantom.exit(2)
	}
}