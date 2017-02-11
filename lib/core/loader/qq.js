var async = require('async')
var common = require('../common')
var querystring = require('querystring')
var request = require('../request')
var HTMLDecoder = require("html-decoder")

exports.name = 'qq'

function invokeResult(cb, err, res, body) {
    if (err) {
        return cb('failed to request ')
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

exports.download = function (options, response) {
    var id = options.id
    var logger = options.logger

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
            if (logger)
                logger('load lyric data')
            request.http_request({
                host: 'c.y.qq.com',
                path: '/v8/fcg-bin/fcg_play_single_song.fcg?' + querystring.stringify(infoQuery),
                method: 'GET',
                headers: {
                    'Referer': 'https://y.qq.com/portal/song/004Nachg25iXNF.html',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            }, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        },
        lyric: (cb) => {
            if (logger)
                logger('load song information')
            request.http_request({
                host: 'c.y.qq.com',
                path: '/lyric/fcgi-bin/fcg_query_lyric_new.fcg?' + querystring.stringify(lyricQuery),
                method: 'GET',
                headers: {
                    'Referer': 'https://y.qq.com/portal/player.html',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            }, (err, res, body) => {
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
            var lyric = results.lyric

            var singer = []

            song.singer.forEach(function(e) {
                singer.push({
                    name: e.name,
                    id: e.mid,
                })
            });

            var result = {
                source: 'qq',
                id: song.mid,
                name: song.name,
                singer: singer,
                lrc: lyric.lyric && new Buffer(lyric.lyric, 'base64').toString() || null,
                tlrc: lyric.trans && new Buffer(lyric.trans, 'base64').toString() || null,
                nolyric: false,
                album: {
                    name: song.album.name,
                    id: song.album.mid,
                },
            }

            if (result.lrc && result.lrc.indexOf('[00:00:00]此歌曲为没有填词的纯音乐') != -1) {
                result.nolyric = true
                result.lrc = null
            }

            response(common.makeLyricResponseData([ result ]))
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}

exports.search = function (options, response) {
    var name = options.name
    var logger = options.logger
    
    var index = Math.floor(options.index || 0) + 1
    var length = Math.floor(options.length || 30)

    if (index < 1 && length < 1)
        return response(common.makeFailedData('invailed results range'))

    var query = {
        remoteplace:'txt.yqq.song',
        t:0,
        aggr:1,
        cr:1,
        catZhida:1,
        lossless:0,
        flag_qc:0,
        p:index,
        n:length,
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
            if (logger)
                logger('load search results')
            request.http_request({
                host: 'c.y.qq.com',
                path: '/soso/fcgi-bin/search_cp?' + querystring.stringify(query),
                method: 'GET',
                headers: {
                    'Referer': 'https://y.qq.com/portal/search.html',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            }, (err, res, body) => {
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

            response(common.makeSearchResponseData(ret, results.search.data.song.totalnum))
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}
