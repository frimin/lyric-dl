var fs = require('fs')
var loader = require('../core/loader')
var common = require('../core/common')
var async = require('async')

exports.alias = ['dl']
exports.help = "\
usage:  download <url1 [url2 [...]]>\n\
        download - (form stdin)  \n\
\n\
    download lyric\n\
\n\
SUPPORT URL FORMAT: \n\
    * ntes (cloudmusic) : http://music.163.com/#/m/song?id=<ID> \n\
\n\
OPTIONS: \n\
    -o --output=<file>          name of output file, if translate lyric exists, named: <file>.tr\n\
    -d --dir=<directory>        name of output directory\n\
    -O --out-format=<format>    output file in given format: <format>=[lrc, json]\n\
"

function parseUrl(url) {
    var loaderInst = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || 
        url.indexOf('http://music.163.com/song?id=') != -1 ||
        url.indexOf('http://music.163.com/#/song?id=') != -1) {

        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            throw `can not read id'`
        } else {
            loaderInst = loader['ntes']
            song_id = m[1]
        }
    }

    if (!loaderInst) {
        throw `not found loader`
    }

    return { 'loader': loaderInst, 'id': song_id }
}

exports.parseUrl = parseUrl

function createDownloadTask(opt, url, downloaded) {
    return function (cb) {
        var rt
        
        try {
            rt = parseUrl(url)
        } catch (e) {
            return cb(`parse url error: ${url}, ${e}`)
        }

        if (!rt) {
            return cb(`invalid url ${url}`)
        }

        var log = common.createLog('download', rt.id)

        if (downloaded[rt.id]) {
            return cb(null, true) // skip current url
        }

        var start = Date.now()

        rt.loader.downloadLyric({ id: rt.id, logger: log }, function (result) {
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

            var writeToFile = []

            switch (outformat)
            {
                case 'lrc':
                    var outfile = outdir + (opt['o'] || opt['output'] || `${result['name']} (${rt.id})`)

                    if (result['lrc']) {
                        writeToFile.push([outfile, result['lrc']])
                    }

                    if (result['tlrc']) {
                        writeToFile.push([outfile + '.tr', result['tlrc']])
                    }

                    break
                case 'json':
                    var outfile = outdir + (opt['o'] || opt['output'] || `${result['name']} (${rt.id}).json`)
                    writeToFile.push([outfile, JSON.stringify(result)])
                    break
                default:
                    console.error(`invalid out format: ${outformat}`)
                    break
            }

            var writeFileTask = []

            writeToFile.forEach((e) => {
                writeFileTask.push((cb) => {
                    fs.writeFile(e[0], e[1], (err) => { 
                        log(`write to file: '${e[0]}'`); 
                        cb(err)
                    })
                })
            })

            if (writeFileTask.length > 0) {
                async.parallel(writeFileTask, (err, results) => {
                    cb(err)
                })
            } else {
                log('no content to write'); 
                cb(null)
            }
        })
    }
}

function downloadList(opt, urlList) {
    if (urlList.length == 0) {
        console.log("nothing to do")
        return process.exit(2)
    }
    
    var downloadTasks = []
    var downloaded = {}
    
    for (var i in urlList) {
        downloadTasks.push(createDownloadTask(opt, urlList[i], downloaded))
    }

    async.series(downloadTasks, function (err, results) {
        if (!err) {
            console.log('done')
            process.exit(0)
        } else {
            console.error(`download abort: ${err}`)
            process.exit(2)
        }
    })
}

function readStdin(callback) {
    var data = ''
    
    process.stdin.on('data', function(chunk) {
        data += chunk;
    })

    process.stdin.on('end', function() {
        callback(data)
    })
}

exports.handler = function (opt) {
    var urlList = []
    
    for (var i in opt['_']) {
        if (i <= 2)
            continue
        urlList.push(opt['_'][i])
    }

    // url list from stdin
    if (urlList.length == 1 && urlList[0] == '-') {
        readStdin((data) => { 
            data = data.split('\n')

            urlList = []
            
            for (var i in data) {
                var url = data[i].trim()
                if (url.length > 0)
                    urlList.push(url)
            }

            downloadList(opt, urlList)
        }) 
    } else {
        downloadList(opt, urlList)
    }
}
