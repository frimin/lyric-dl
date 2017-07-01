var async = require('async');
var common = require('../common');
var querystring = require('querystring');
var request = require('../request');
var HTMLDecoder = require("html-decoder");
var url = require('url');
var lyric = require('../lyric');
var cheerio = null;
var logger = require('../logger');

exports.config = {
    name : 'xiami',
    regHost : /^(www\.)?xiami\.com$/,
    regID: [ 'pathname', /\/\w+\/(.*)$/ ],
    searchNums: 20,
    lyricsExtract : {
        reDeleteLine: /(作词：|作曲：|编曲：)/,
    }
}

exports.download = function (options, response) {
    var id = options.id;
    var log = options.log || logger.createLog('debug');

    async.waterfall([
        // load song info page, for read song id
        function (callback) {
            var reqOptions = {
                host: 'www.xiami.com',
                path: '/song/' + id,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                var m;

                try {
                    common.checkHttpResponseError(err, res);

                    m = body.match(/http:\/\/www.xiami.com\/play\?ids=\/song\/playlist\/id\/(\d+)/);

                    if (!m || m.length != 2) {
                        throw 'failed to match song id';
                    }
                } catch (e) {
                    return callback(e);
                }

                callback(null, m[1]);
            })
        },
        // load song info from song id
        function (songid, callback) {
            var reqOptions = {
                host: 'www.xiami.com',
                path: '/song/playlist/id/' + songid + '/object_name/default/object_id/0/cat/json',
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                },
            };

            log('REQUEST ' + reqOptions.host + reqOptions.path);

            request.http_request(reqOptions, (err, res, body) => {
                try {
                    common.checkHttpResponseError(err, res);
                } catch (e) {
                    callback(e);
                    return;
                }
                callback(null, body);
            })
        },
        // load lyrics from song info if exists
        function (infoJson, callback) {
            try {
                var info = JSON.parse(infoJson)

                if (!info.status) 
                    throw 'response json data not readly';

                var songinfo = (info.data && info.data.trackList && info.data.trackList[0]) ? info.data.trackList[0] : null;

                if (!songinfo) 
                    throw 'no song data';

                if (!songinfo.lyricInfo || !songinfo.lyricInfo.lyricFile) { // no lyrics
                    callback(null, songinfo, null);
                    return;
                }

                var urlinfo = url.parse(songinfo.lyricInfo.lyricFile)

                var reqOptions = { 
                    host: urlinfo.host,
                    path: urlinfo.path,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
                    },
                };

                log('REQUEST ' + reqOptions.host + reqOptions.path);

                request.http_request(reqOptions, (err, res, body) => {
                    try {
                        common.checkHttpResponseError(err, res)
                    } catch (e) {
                        callback(e);
                        return;
                    }

                    callback(null, songinfo, body);
                })
            } catch (e) {
                callback(e);
            }
        },
        function (song, lyricdata, callback) {
            var lyricLines;
            var original;
            var translate;

            if (lyricdata) {
                lyricLines = lyricdata.split('\n');

                original = [];

                for(var i in lyricLines) {
                    var line = lyricLines[i].trim();
                    // it's translate line ?
                    if (line.startsWith('[x-trans]')) {
                        if (!translate) {
                            translate = original.slice(); // copy array
                            translate.pop(); // remove last one
                        }
                        translate.push(line.replace('[x-trans]', original[original.length - 1].match(/\[.+\]/)[0]));
                    } else {
                        original.push(line.replace(/<\d+>/g, ''));
                    }
                }
            }

            var singer = [];

            for (var i in song.singersSource) {
                singer.push({
                    name: song.singersSource[i].artistName,
                    id: song.singersSource[i].artistStringId,
                    href: 'http://www.xiami.com/artist/' + song.singersSource[i].artistStringId,
                });
            }

            if (options.extract == true) {
                var ret = lyric.extractLyrics(original, translate, exports.config.lyricsExtract);
                original = ret[0];
                translate = ret[1];
            } else {
                if (original)
                    original = original.join('\n');
                if (translate)
                    translate = translate.join('\n');
            }

            var result = {
                source: 'xiami',
                id: song.songStringId,
                href: 'http://www.xiami.com/song/' + song.songStringId,
                name: song.songName,
                tname: song.subName,
                singer: singer,
                lrc: original || null,
                tlrc: translate || null,
                album: {
                    name: song.album_name,
                    id: song.albumStringId,
                    href: 'http://www.xiami.com/album/' + song.albumStringId,
                },
            };

            callback(null, common.makeLyricResponseData([ result ]));
        }
    ], (err, result) => {
        if (err) {
            response(common.makeFailedData(err));
        } else {
            response(result);
        }
    })
}

exports.search = function (options, response) {
    cheerio = cheerio || require('cheerio'); // load if need
    
    var name = options.name;
    var log = options.log || logger.createLog('debug');

    var page = Math.floor(options.page || 1)
    
    var query = {
        key: name,
        category:-1,
    }

    var reqOptions = {
        host: 'www.xiami.com',
        path: '/search/song/page/' + page + '?' + querystring.stringify(query),
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36,'
        },
    };

    log('REQUEST ' + reqOptions.host + reqOptions.path);

    request.http_request(reqOptions, (err, res, body) => {
        try {
            common.checkHttpResponseError(err, res);
        } catch (e) {
            response(common.makeFailedData(e));
            return;
        }

        const $ = cheerio.load(body);

        var totalCount = $('.seek_counts b')[0].children[0].data

        var trackList = $('.track_list tbody tr');

        var nameList = trackList.find('.song_name');
        var artistList = trackList.find('.song_artist');
        var albumList = trackList.find('.song_album');

        if (nameList.length != artistList.length || artistList.length != albumList.length) {
            response(common.makeFailedData('search results amount error'));
            return;
        }

        var results = [];

        for (var i = 0; nameList.length != i; i++) {
            var info = {};

            for (var j = 0; nameList[i].children.length != j; j++) {
                var n = nameList[i].children[j];

                if (n.type != 'tag' || n.name != 'a')
                    continue;

                if (!info.name && (n.attribs.href.indexOf('http://') != -1)) {
                    info.name = n.attribs.title;
                    info.href = n.attribs.href;
                    info.id = n.attribs.href.match(/\/\w+\/(.*)$/)[1];
                    break;
                }
            }

            for (var j = 0; albumList[i].children.length != j; j++) {
                var n = albumList[i].children[j];

                if (n.type != 'tag' || n.name != 'a')
                    continue;

                if (!info.album && (n.attribs.href.indexOf('http://') != -1)) {
                    info.album = {
                        name: n.attribs.title,
                        href: n.attribs.href,
                        id: n.attribs.href.match(/\/\w+\/(.*)$/)[1],
                    };
                    break;
                }
            }

            var singler = [];

            for (var j = 0; artistList[i].children.length != j; j++) {
                var n = artistList[i].children[j];

                if (n.type != 'tag' || n.name != 'a')
                    continue;

                singler.push({
                    name: n.children[0].data ? n.children[0].data.trim() : n.attribs.title,
                    href: n.attribs.href,
                    iid: n.attribs.href.match(/\/\w+\/(.*)$/)[1],
                });
            }

            info.singler = singler;

            results.push(info);
        }

        response(common.makeSearchResponseData(results, {
            page: page,
            pagetotal: Math.floor(parseInt(totalCount) / exports.config.searchNums) + 1,
            total: parseInt(totalCount),
        }));
    })
}

