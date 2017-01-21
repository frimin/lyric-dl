var system = require('system')
var common = require(phantom.libraryPath + '/core/common.js')

function parseUrl(url) {
    var loader = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || url.indexOf('http://music.163.com/song?id=') != -1) {
        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            console.log("invalid url")
            return false
        } else {
            loader = common.getLoader('ntes')
            song_id = m[1]
        }
    } else if (url.indexOf('https://y.qq.com/portal/song/') != -1) {
        var m = url.match(/song\/(\w+)\.html/)

        if (!m || m.length != 2) {
            console.log("invalid url")
            return false
        } else {
            loader = common.getLoader('qq')
            song_id = m[1]
        }
    }

    if (loader == null || song_id == null) {
        console.log("invalid url")
        return false
    } else {
        return { 'loader': loader, 'id': song_id }
    }
}

function createDownloadTask(opt, url, downloaded) {
    return function (done) {
        var rt = parseUrl(url)

        if (!rt) {
            return done(false)
        }

        if (downloaded[rt['id']]) {
            return done(true) // skip current url
        }

        var loger = common.createLog('download', rt['id'])

        rt['loader'].downloadLyric(loger, rt['id'], function (result) {
            downloaded[rt['id']] = true

            var outformat = opt['O'] || opt['out-format'] || 'lrc'
            var outdir = opt['d'] || opt['directory'] || ''

            if ((outdir.length > 0) && (outdir.charAt(outdir.length - 1) != '/')) {
                outdir = outdir + '/'
            }

            switch (outformat)
            {
                case 'lrc':
                    var outfile = outdir + (opt['o'] || opt['output'] || result['name'] + ' (' + rt['id'] + ')')

                    var wrote = false

                    if (result['lrc']) {
                        fs.write(outfile, result['lrc'], 'w')
                        loger('write to file: ' + outfile)
                        wrote = true
                    }

                    if (result['tlrc']) {
                        fs.write(outfile + '.tr', result['tlrc'], 'w')
                        loger('write to file: ' + outfile + '.tr')
                        wrote = true
                    }

                    if (!wrote) {
                        loger('no content to write')
                    }

                    break
                case 'json':
                    var outfile = outdir + (opt['o'] || opt['output'] || (result['name'] + ' (' + rt['id'] + ')' + '.json'))
                    loger('write to file: ' + outfile)
                    fs.write(outfile, JSON.stringify(result), 'w')
                    break
                default:
                    console.log("invalid out format: " + outformat)
                    break
            }

            done(true)
        })
    }
}

exports.handler = function (opt) {
    var urlList = []
    
    for (var i in opt['_']) {
        if (i <= 1)
            continue
        urlList.push(opt['_'][i])
    }

    // url list from stdin
    if (urlList.length == 1 && urlList[0] == '-') {
        var content = system.stdin.read()
        content = content.split('\n')
        urlList = []
        
        for (var i in content) {
            var url = content[i].trim()
            if (url.length > 0)
                urlList.push(url)
        }
    }

    if (urlList.length == 0) {
        console.log("nothing to do")
        return phantom.exit(2)
    }
    
    var downloadTasks = []
    var downloaded = {}
    
    for (var i in urlList) {
        downloadTasks.push(createDownloadTask(opt, urlList[i], downloaded))
    }

    common.async.series(downloadTasks, function (succeed) {
        if (succeed) {
            phantom.exit(0)
        } else {
            console.log('abort')
            phantom.exit(2)
        }
    })
}
