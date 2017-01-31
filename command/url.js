// url.js

exports.help = "\
usage:  url <url1 [url2 [...]]>\n\
        url - (form stdin)  \n\
\n\
    download lyric\n\
\n\
SUPPORT URL: \n\
    * ntes (cloudmusic) : http://music.163.com/#/m/song?id=<ID> \n\
    * qq (qqmusic) : https://y.qq.com/portal/song/<ID>.html \n\
\n\
OPTIONS: \n\
    -o --output=<file>          name of output file, if translate lyric exists, named: <file>.tr\n\
    -d --dir=<directory>        name of output directory\n\
    -O --out-format=<format>    output file in given format: <format>=[lrc, json]\n\
"

function parseUrl(url) {
    var loader = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || url.indexOf('http://music.163.com/song?id=') != -1) {
        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            return false
        } else {
            loader = common.getLoader('ntes')
            song_id = m[1]
        }
    } else if (url.indexOf('https://y.qq.com/portal/song/') != -1) {
        var m = url.match(/song\/(\w+)\.html/)

        if (!m || m.length != 2) {
            return false
        } else {
            loader = common.getLoader('qq')
            song_id = m[1]
        }
    }

    if (loader == null || song_id == null) {
        return false
    } else {
        return { 'loader': loader, 'id': song_id }
    }
}

exports.parseUrl = parseUrl

function createDownloadTask(opt, url, downloaded) {
    return function (done) {
        var rt = parseUrl(url)

        var log = common.createLog('download', rt.id)

        if (!rt) {
            log("invalid url")
            return done(false)
        }

        if (downloaded[rt['id']]) {
            return done(true) // skip current url
        }

        var start = Date.now()

        rt.loader.downloadLyric(log, rt.id, function (result) {
            downloaded[rt.id] = true

            if (result['code'] == 200) {
                log('succeed, ' + (Date.now() - start).toString() + ' msec usage')
            } else {
                log(result['err'])
            }

            var outformat = opt['O'] || opt['out-format'] || 'lrc'
            var outdir = opt['d'] || opt['directory'] || ''

            if ((outdir.length > 0) && (outdir.charAt(outdir.length - 1) != '/')) {
                outdir = outdir + '/'
            }

            switch (outformat)
            {
                case 'lrc':
                    var outfile = outdir + (opt['o'] || opt['output'] || result['name'] + ' (' + rt.id + ')')

                    var wrote = false

                    if (result['lrc']) {
                        fs.write(outfile, result['lrc'], 'w')
                        log('write to file: ' + outfile)
                        wrote = true
                    }

                    if (result['tlrc']) {
                        fs.write(outfile + '.tr', result['tlrc'], 'w')
                        log('write to file: ' + outfile + '.tr')
                        wrote = true
                    }

                    if (!wrote) {
                        log('no content to write')
                    }

                    break
                case 'json':
                    var outfile = outdir + (opt['o'] || opt['output'] || (result['name'] + ' (' + rt.id + ')' + '.json'))
                    log('write to file: ' + outfile)
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
