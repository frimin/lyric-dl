var async = require('async')
var common = require('../common')
var querystring = require('querystring')
var request = require('../request')
var HTMLDecoder = require("html-decoder")
var lyric = require('../lyric');
var logger = require('../logger');

exports.config = {
    name : 'qq',
    regHost : /^y\.qq\.com$/,
    regID: [ 'pathname', /song\/(\w+)\.html$/],
    searchNums: 20,
    lyricsExtract : {
        reDeleteLine: /(腾讯|词：|曲：)/,
        reDeleteWord: /\/\//g,
    }
}

function invokeResult(cb, err, res, body) {
    if (err) {
        return cb('failed to request')
    }

    if (res.statusCode != 200) {
        return cb(`response status code ${res.statusCode}`)
    } else {
        if (!body || body.length == 0) {
            return cb('empty response body')
        }

        var ret

        try {
            var start = body.indexOf('(')
            var end = body.lastIndexOf(')')
            ret = JSON.parse(body.substr(start + 1, end - start - 1))
        } catch(e) {
            return cb('failed to parse json')
        }

        if (ret.code == 0) {
            return cb(null, ret)
        } else {
            if (ret.code == -1901) {
                return cb(null, {}) // no lyrics
            } else {
                return cb('invalid result')
            }
        }
    }
}

function doDownload(options, response) {
    var id = options.id;
    var log = options.log || logger.createLog('debug');

    var infoQuery = {
        callback: 'getOneSongInfoCallback',
        pcachetime: new Date().getTime(),
        tpl:'yqq_song_detail',
        songmid: id,
        g_tk:5381,
        jsonpCallback: 'getOneSongInfoCallback',
        loginUin:0,
        hostUin:0,
        format:'jsonp',
        inCharset:'utf8',
        outCharset:'utf-8',
        notice:0,
        platform:'yqq',
        needNewCode: 0,
    }

    var lyricQuery = {
        callback: 'MusicJsonCallback_lrc',
        pcachetime: new Date().getTime(),
        songmid: id,
        g_tk:5381,
        jsonpCallback: 'MusicJsonCallback_lrc',
        loginUin:0,
        hostUin:0,
        format:'jsonp',
        inCharset:'utf8',
        outCharset:'utf-8',
        notice:0,
        platform:'yqq',
        needNewCode: 0,
    }

    async.parallel({
        info : (cb) => {
            var reqOptions = {
                host: 'c.y.qq.com',
                path: '/v8/fcg-bin/fcg_play_single_song.fcg?' + querystring.stringify(infoQuery),
                method: 'GET',
                headers: {
                    'Referer': `https://y.qq.com/portal/song/${id}.html`,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        },
        lyric: (cb) => {
            var reqOptions = {
                host: 'c.y.qq.com',
                path: '/lyric/fcgi-bin/fcg_query_lyric_new.fcg?' + querystring.stringify(lyricQuery),
                method: 'GET',
                headers: {
                    'Referer': 'https://y.qq.com/portal/player.html',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        },
    }, (err, results) => {
        try 
        {
            if (err) {
                throw err
            }

            if (!results.info.data || results.info.data.length != 1)
                throw 'failed to read information'

            var song = results.info.data[0]
            var lrc = results.lyric

            var singer = []

            song.singer.forEach(function(e) {
                singer.push({
                    name: e.name,
                    id: e.mid,
                    href: 'https://y.qq.com/n/yqq/singer/' + e.mid + '.html',
                })
            });

            var result = {
                source: 'qq',
                id: song.mid,
                href: 'https://y.qq.com/n/yqq/song/' + song.mid + '.html',
                name: song.name,
                singer: singer,
                lrc: lrc.lyric && new Buffer(lrc.lyric, 'base64').toString() || null,
                tlrc: lrc.trans && new Buffer(lrc.trans, 'base64').toString() || null,
                nolyric: false,
                album: {
                    name: song.album.name,
                    id: song.album.mid,
                    href: 'https://y.qq.com/n/yqq/album/' + song.album.mid + '.html',
                },
            }

            if (result.lrc && result.lrc.indexOf('[00:00:00]此歌曲为没有填词的纯音乐') != -1) {
                result.nolyric = true;
                result.lrc = null;
                result.tlrc = null;
            }

            if (options.extract == true) {
                var ret = lyric.extractLyrics(result.lrc, result.tlrc, exports.config.lyricsExtract);
                result.lrc = ret[0];
                result.tlrc = ret[1];
            }

            response(common.makeLyricResponseData([ result ]));
        } catch (e) {
            response(common.makeFailedData(e));
        }
    })
}

function tryConvertIDToMID(options, response) {
    var log = options.log || logger.createLog('debug');;

    if (/^\d+_num/.test(options.id)) {
        var reqOptions = {
            host: 'y.qq.com',
            path: `/n/yqq/song/${options.id}.html`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
            },
        };

        log('REQUEST ' + reqOptions.host + reqOptions.path);

        request.http_request(reqOptions, (err, res, body) => {
            try {
                common.checkHttpResponseError(err, res);

                var m = body.match(/"songmid":"(\w+)",/)

                if (m && m.length == 2) {
                    options.id = m[1]
                    doDownload(options, response)
                } else {
                    throw 'failed to match mid'
                }
            } catch (e) {
                response(common.makeFailedData(e))
            }
        })
    } else {
        doDownload(options, response)
    }
}

exports.download = tryConvertIDToMID

exports.search = function (options, response) {
    var name = options.name;
    var log = options.log || logger.createLog('debug');
    
    var page = Math.floor(options.page || 1)

    var query = {
        remoteplace:'txt.yqq.song',
        t:0,
        aggr:1,
        cr:1,
        catZhida:1,
        lossless:0,
        flag_qc:0,
        p:page,
        n:exports.config.searchNums,
        w:name,
        callback: 'searchCallbacksong8927',
        pcachetime: new Date().getTime(),
        g_tk:5381,
        jsonpCallback: 'searchCallbacksong8927',
        loginUin:0,
        hostUin:0,
        format:'jsonp',
        inCharset:'utf8',
        outCharset:'utf-8',
        notice:0,
        platform:'yqq',
        needNewCode: 0,
    }

    async.parallel({
        search: (cb) => {
            var reqOptions = {
                host: 'c.y.qq.com',
                path: '/soso/fcgi-bin/search_cp?' + querystring.stringify(query),
                method: 'GET',
                headers: {
                    'Referer': 'https://y.qq.com/portal/search.html',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        }
    }, (err, results) => {
        try 
        {
            if (err) {
                throw err
            }

            var songs = results.search.data.song

            if (!songs || !songs.list)
                throw 'failed to read information'

            var ret = []

            songs.list.forEach(function(e) {
                if (!e.strMediaMid)
                    return

                var singler = []

                e.singer.forEach(function(e) {
                    singler.push({
                        id: e.mid,
                        name: HTMLDecoder.decode(e.name),
                        href: `https://y.qq.com/portal/singer/${e.mid}.html`,
                    })
                })

                ret.push({
                    name: HTMLDecoder.decode(e.songname),
                    href: `https://y.qq.com/portal/song/${e.strMediaMid}.html`,
                    id: e.strMediaMid,
                    singler: singler,
                    album: {
                        id: e.albummid,
                        name: HTMLDecoder.decode(e.albumname),
                        href: `https://y.qq.com/portal/album/${e.albummid}.html`,
                    }
                })
            })

            
            var totalCount = results.search.data.song.totalnum;

            response(common.makeSearchResponseData(ret, {
                page: page,
                pagetotal: Math.floor(totalCount / exports.config.searchNums) + 1,
                total: totalCount,
            }));
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}