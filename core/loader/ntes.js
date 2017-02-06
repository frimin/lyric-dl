var CryptoJS = require("crypto-js");
var async = require('async')
var common = require('../common')
var querystring = require('querystring')
var request = require('../request')
var rsa = require('../rsa')

var config = {
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
        , d = CryptoJS.enc.Utf8.parse(config.encrypt.aseiv)
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
        config.encrypt.rsaEncryptionExponent,
        config.encrypt.rsaModulus,
        config.encrypt.aseSecretPassphrase))
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

exports.downloadLyric = function (options, response) {
    var id = options.id
    var logger = options.logger

    var postData = encryptEncodeArgs({
        id: id, 
        lv: -1, 
        tv: -1, 
        csrf_token: ""
    })

    var query = {
        id: id,
        ids: `[${id}]`,
    }

    async.parallel({
        info: (cb) => {
            if (logger)
                logger('load song information')
            request.http_request({
                host: 'music.163.com',
                path: '/api/song/detail/?id=' + querystring.stringify(query),
                method: 'GET',
                headers: {
                    'Referer': 'http://music.163.com/',
                    'Origin':'http://music.163.com',
                    'DNT': 1,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,',
                },
            }, (err, res, body) => {
                invokeResult(cb, err, res, body)
            })
        },
        lyric : (cb) => {
            if (logger)
                logger('load lyric data')
            request.http_request({
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
            }, (err, res, body) => {
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
            var lyric = results.lyric

            var singer = []

            song.artists.forEach(function(e) {
                singer.push({
                    name: e.name,
                    id: e.id,
                })
            });

            response(common.makeLyricResponseData([{
                source: 'ntes',
                id: song.id,
                name: song.name,
                singer: singer,
                lrc: lyric.lrc && lyric.lrc.lyric || null,
                tlrc: lyric.tlyric && lyric.tlyric.lyric || null,
                nolyric: lyric.nolyric,
                album: {
                    name: song.album.name,
                    id: song.album.id,
                },
            }]))
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}

exports.search = function (options, response) {
    var name = options.name
    var logger = options.logger
    
    var postData = encryptEncodeArgs({
        s: name,
        type: '1',
        offset: 0,
        total: true,
        limit: 30,
        csrf_token: '',
    })

    async.parallel({
        search: (cb) => {
            if (logger)
                logger('load search results')
            request.http_request({
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
            }, (err, res, body) => {
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

            var results = []

            songs.forEach(function(e) {
                var singler = []

                e.ar.forEach(function(e) {
                    singler.push({
                        id: e.id,
                        name: e.name,
                        href: `http://music.163.com/#/artist?id=${e.id}`,
                    })
                })

                results.push({
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

            response(common.makeSearchResponseData(results))
        } catch (e) {
            response(common.makeFailedData(e))
        }
    })
}
