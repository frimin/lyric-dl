var loader = require('../core/loader');
var common = require('../core/common');
var fs = require('fs');
var async = require('async');

var nonAllPrintOpt = [ 'outputOriginal', 'outputTranslate' ];

function parseUrl(url) {
    var loaderInst = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || 
        url.indexOf('http://music.163.com/song?id=') != -1 ||
        url.indexOf('http://music.163.com/#/song?id=') != -1) {

        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            throw 'can not read id'
        } else {
            loaderInst = loader['ntes']
            song_id = m[1]
        }
    } else if (url.indexOf('https://y.qq.com/portal/song/') != -1 ||
            url.indexOf('https://y.qq.com/n/yqq/song/') != -1) {
        var m = url.match(/song\/(\w+)\.html/)

        if (!m || m.length != 2) {
            return false
        } else {
            loaderInst = loader['qq']
            song_id = m[1]
        }
    }

    if (!loaderInst) {
        throw `can't found lyric loader, url may invalid or not support`
    }

    return { 'loader': loaderInst, 'id': song_id }
}

exports.parseUrl = parseUrl

function tryExtractLyricToStr(lrc) {
    if (Array.isArray(lrc)) {
        var lines = []
        lrc.forEach((e) => {
            lines.push(`[${e[0]}]${e[1]}`)
        })
        return lines.join('\n')
    }
    return lrc
}

function createWriteTask(options, id, name, content, ext) {
    return function (cb) {
        var wstream;

        var outdir = options['d'] || options['dir'];

        if (outdir) {
            if (!outdir.endsWith('/'))
                outdir = outdir + '/';

            var outfile = outdir + (options['o'] || options['output'] || ('' + name + ' (' + id + ').' + ext));

            wstream = fs.createWriteStream(outfile);
        } else {
            wstream = process.stdout;
        }

        wstream.write(content, (err) => {
            cb(err);
        });
    }
}

function createDownloadTask(url, options, downloaded) {
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

        if (downloaded[rt.id]) {
            return cb(null, true) // skip current url
        }

        rt.loader.download({ 
            id: rt.id, 
            extract: options['extract'] && true || false 
        }, function (result) {
            downloaded[rt.id] = true

            if (result['err']) {
                console.error(result['err'])
                process.exit(2)
            }

            var format = options['O'] || options['outFormat'] || 'lrc'

            var writeTasks = []

            var printAll = true

            nonAllPrintOpt.forEach((e) => {
                printAll = !options[e] && printAll
            })

            switch (format)
            {
                case 'lrc':
                    if (result['lrc'] && (printAll || options['outputOriginal'] ))
                        writeTasks.push(createWriteTask(options, rt.id, result['name'], tryExtractLyricToStr(result['lrc']), format))
                    if (result['tlrc'] && (printAll || options['outputTranslate']))
                        writeTasks.push(createWriteTask(options, rt.id, result['name'], tryExtractLyricToStr(result['tlrc']), 'tr.' + format))
                    break
                case 'json':
                    writeTasks.push(createWriteTask(options, rt.id, result['name'], JSON.stringify(result), format))
                    break 
                default:
                    console.error("invalid out format:" + outformat) 
                    break
            }

            async.series(writeTasks, function (err, results) {
                cb(err);
            });
        })
    }
}

function downloadList(urlList, options) {
    if (urlList.length == 0) {
        console.error("nothing to do");
        return process.exit(2);
    }

    var downloadTasks = [];
    var downloaded = {};
    
    for (var i in urlList) {
        downloadTasks.push(createDownloadTask(urlList[i], options, downloaded));
    }

    async.series(downloadTasks, function (err, results) {
        if (!err) {
            process.exit(0);
        } else {
            console.error(`download abort: ${err}`)
            process.exit(2);
        }
    });
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

function handler(urlList, options) {
    // url list from stdin
    if (urlList.length == 1 && urlList[0] == '-') {
        readStdin((data) => { 
            data = data.split('\n')

            var list = []
            
            for (var i in data) {
                var url = data[i].trim()
                if (url.length > 0) {
                    list.push(url)
                }
            }

            downloadList(list, options)
        }) 
    } else {
        downloadList(urlList, options)
    }
}

var description= "download lyric, support url format: \n\
\n\
    * ntes (cloudmusic) : http://music.163.com/#/m/song?id=<ID> \n\
    * qq (qqmusic) : https://y.qq.com/portal/song/<ID>.html \n"

exports.init = function (state, program) {
    program
        .command('download <url...>')
        .description('download lyric')
        .alias('dl')
        .option('-o, --output <file>', 'name of output file, if translate lyric exists, named: <file>.tr')
        .option('-d, --dir <directory>', 'name of output directory')
        .option('-O, --out-format <format>', 'output file in given format: <format>=[lrc, json]')
        .option('--extract', 'extract lyrics content, match time and lines')
        .option('--output-original', 'enable output original lyrics content')
        .option('--output-translate', 'enable output translate lyrics content')
        .action(function(args, options){
            state.execCmd = true
            handler(args, options);
        });
}