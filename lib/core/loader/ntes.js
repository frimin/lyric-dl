var CryptoJS = require("crypto-js");
var async = require('async')
var common = require('../common')
var querystring = require('querystring')
var request = require('../request')
var rsa = require('../rsa')
var lyric = require('../lyric');
var logger = require('../logger');

exports.config = {
    name : 'ntes',
    regHost : /^music\.163\.com$/,
    regID: [ 'href', /id=(\d+)/, ],
    searchNums: 30,
    lyricsExtract : {
        deleteLineLimit: 5,
        reDeleteLine: /(作曲|作词|by::编曲)/,
    }
}

var localconfig = {
    encrypt: {
        rsaEncryptionExponent: '010001',
        rsaModulus: '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7',
        aseiv: '0102030405060708',
        aseSecretPassphrase: '0CoJUm6Qyw8W8jud',
    },
}

function randKey(a) {
    var d, e, b = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", c = "";
    for (d = 0; a > d; d += 1)
        e = Math.random() * b.length,
        e = Math.floor(e),
        c += b.charAt(e);
    return c
}

function aesEncrypt(a, b) {
    var c = CryptoJS.enc.Utf8.parse(b)
        , d = CryptoJS.enc.Utf8.parse(localconfig.encrypt.aseiv)
        , e = CryptoJS.enc.Utf8.parse(a)
        , f = CryptoJS.AES.encrypt(e, c, {
        iv: d,
        mode: CryptoJS.mode.CBC
    });
    
    return f.toString()
}
function rsaEncrypt(text, encryptionExponent, modulus) {
    rsa.BigInt.setMaxDigits(131)
    var key = new rsa.RSAKeyPair(encryptionExponent,"",modulus)
    return rsa.encryptedString(key, text)
}

function encrypt(d, e, f, g) {
    var h = {}, i = randKey(16);
    return h.params = aesEncrypt(d, g),
    h.params = aesEncrypt(h.params, i),
    h.encSecKey = rsaEncrypt(i, e, f),
    h
}

function encryptEncodeArgs(args) {
    return querystring.stringify(encrypt(
        JSON.stringify(args), 
        localconfig.encrypt.rsaEncryptionExponent,
        localconfig.encrypt.rsaModulus,
        localconfig.encrypt.aseSecretPassphrase))
}

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
            ret = JSON.parse(body)
        } catch(e) {
            return cb('failed to parse json')
        }

        if (ret.code == 200) {
            return cb(null, ret)
        } else {
            return cb('invalid result')
        }
    }
}

exports.download = function (options, response) {
    var id = options.id;
    var log = options.log || logger.createLog('debug');

    var postData = encryptEncodeArgs({
        id: id, 
        lv: -1, 
        tv: -1, 
        csrf_token: ""
    });

    var query = {
        id: id,
        ids: `[${id}]`,
    };

    async.parallel({
        info: (cb) => {
            var reqOptions = {
                host: 'music.163.com',
                path: '/api/song/detail/?id=' + querystring.stringify(query),
                method: 'GET',
                headers: {
                    'Referer': 'http://music.163.com/',
                    'Origin':'http://music.163.com',
                    'DNT': 1,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,',
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        },
        lyric : (cb) => {
            var reqOptions = {
                host: 'music.163.com',
                path: '/weapi/song/lyric?csrf_token=',
                method: 'POST',
                headers: {
                    'Content-Length': Buffer.byteLength(postData),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://music.163.com/song?id=' + id,
                    'Origin':'http://music.163.com',
                    'DNT': 1,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,',
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            }, postData)
        },
    }, (err, results) => {
        try 
        {
            if (err) {
                throw err
            }

            if (!results.info.songs || results.info.songs.length != 1)
                throw 'failed to read information'

            var song = results.info.songs[0]
            var lrc = results.lyric

            var singer = []

            song.artists.forEach(function(e) {
                singer.push({
                    name: e.name,
                    id: e.id,
                    href: 'http://music.163.com/#/artist?id=' + e.id,
                })
            });

            var result = common.makeLyricResponseData([{
                source: 'ntes',
                id: song.id,
                href: 'http://music.163.com/#/m/song?id=' + song.id,
                name: song.name,
                singer: singer,
                lrc: lrc.lrc && lrc.lrc.lyric || null,
                tlrc: lrc.tlyric && lrc.tlyric.lyric || null,
                nolyric: lrc.nolyric,
                album: {
                    name: song.album.name,
                    id: song.album.id,
                    href: 'http://music.163.com/#/album?id=' + song.album.id,
                },
            }])

            if (options.extract == true) {
                var ret = lyric.extractLyrics(result.lrc, result.tlrc, exports.config.lyricsExtract);
                result.lrc = ret[0];
                result.tlrc = ret[1];
            }

            response(result)
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}

exports.search = function (options, response) {
    var name = options.name;
    var log = options.log || logger.createLog('debug');
    
    var page = options.page || 1;

    var postData = encryptEncodeArgs({
        s: name,
        type: '1',
        offset: (page - 1) * exports.config.searchNums,
        total: true,
        limit: exports.config.searchNums,
        csrf_token: '',
    })

    async.parallel({
        search: (cb) => {
            var reqOptions = {
                host: 'music.163.com',
                path: '/weapi/cloudsearch/get/web?csrf_token=',
                method: 'POST',
                headers: {
                    'Content-Length': Buffer.byteLength(postData),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://music.163.com/search/',
                    'Origin':'http://music.163.com',
                    'DNT': 1,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,',
                },
            };
            
            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                invokeResult(cb, err, res, body)
            }, postData)
        }
    }, (err, results) => {
        try 
        {
            if (err) {
                throw err
            }

            var songs = results.search.result.songs

            if (!songs)
                throw 'failed to read information'

            var ret = []

            songs.forEach(function(e) {
                var singler = []

                e.ar.forEach(function(e) {
                    singler.push({
                        id: e.id,
                        name: e.name,
                        href: `http://music.163.com/#/artist?id=${e.id}`,
                    })
                })

                ret.push({
                    name: e.name,
                    href: `http://music.163.com/#/song?id=${e.id}`,
                    id: e.id,
                    singler: singler,
                    album: {
                        id: e.al.id,
                        name: e.al.name,
                        href: `http://music.163.com/artist?id=${e.al.id}`,
                    }
                })
            })

            var totalCount = results.search.result.songCount;

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
