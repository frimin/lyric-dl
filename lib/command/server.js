var http = require('http')
var querystring = require('querystring')
var url = require('url')
var loader = require('../core/loader')
var common = require('../core/common')
var command_download = require('./download')

exports.help = "\
usage:  server\n\
\n\
    launch http service\n\
\n\
SUPPORT PATH: \n\
    /api/search                 sreach from name, post params: target=<name>&from=<searchfrom> \n\
    /api/download               download lyric, post params: target=<url> \n\
\n\
OPTIONS: \n\
    -h --host=<host>            bind address (default: 127.0.0.1)\n\
    -p --port=<format>          bind port (default: 8080)\n\
"

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

pathHandler['/api/download'] = function(args, response) {
    if (!args['target']) {
        return response(JSON.stringify(common.makeFailedData('invalid argument')))
    }

    var rt

    try {
        rt = command_download.parseUrl(args['target'])
    } catch (e) {
        return response(JSON.stringify(common.makeFailedData(`invalid url: ${args.target}`)))
    }

    if (!rt) {
        serverLog('invalid url : ' + args['target'])
        return response(JSON.stringify(common.makeFailedData('invalid url')))
    }

    var log = common.createLog('api download', rt.id)

    rt.loader.download({ id: rt.id, logger: log, extract: true }, function (result) {
        response(JSON.stringify(result))
    })
}

pathHandler['/api/search'] = function(args, response) {
    if (!args['target']) {
        return response(JSON.stringify(common.makeFailedData('invalid argument')))
    }

    var loaderInst = loader[args['from'] || 'ntes']

    if (!loaderInst) {
        serverLog('invalid source : ' + args['from'])
        return response(JSON.stringify(common.makeFailedData('invalid source')))
    }

    var log = common.createLog('api search', args['target'])

    loaderInst.search({ name:args['target'], logger: log }, (result) => {
        response(JSON.stringify(result))
    })
}

exports.handler = function (opt) {
    var port = parseInt(opt['p'] || opt['port'] || 8080)
    var host = (opt['h'] || opt['host'] || 'localhost')

    var server = http.createServer((req, res) => {
        serverLog(`request : ${req.method} "${req.url}"`)

        if (req.method != 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.write("405 Method Not Allowed");
            res.end()
            return
        }

        function _response(content) { 
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json; charset=utf-8')
			res.write(content)
			res.end()
		}

        var query = url.parse(req.url, true);
        var body = ''

        req.on('data', (data) => {
            body += data;
        })

        req.on('end', () => {
            var hander = pathHandler[query.path]

            if (!hander) {
                serverLog('not found path : ' + query.path)
                res.statusCode = 404
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.write("404 Not Found")
                res.end()
                return 
            }

            try {
                hander(querystring.parse(body), _response)
            } catch (e) {
                serverLog(e)
                res.statusCode = 500
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.write("500 Internal Server Error");
                res.end()
                return 
            }
        })
    })

    var launch = false

    server.on('error', (err) => {
        console.error(err.message)
        if (!launch) {
            process.exit(2)
        }
    })

    server.listen(port, host, () => {
        console.log(`server started - http://${host}:${port}`)
        launch = true
    })
}