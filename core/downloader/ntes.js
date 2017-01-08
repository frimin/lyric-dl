var common = require(phantom.libraryPath + '/core/common.js')

exports.downloadLyric = function (id, response) {
    var log = common.createLog('ntes:lyric', id)
    var url = 'http://music.163.com/#/m/song?id=' + id
    log('open: ' + url)
    var page = common.createPage(url, function(status) {
        if (status != 'success') {
            log('failed')
            response(common.makeFailedData('failed to open page'))
            return
        } else {
            log('ok')
        }

        page.onConsoleMessage = function(msg, lineNum, sourceId) {
            try {
                log('load lyrics finished, try read song info')
                var song_info = page.evaluate(function() {
                    var c = window.contentFrame.document.getElementsByTagName('a')
                    var name = null
                    var tname = null
                    var mv_id = null
                    var album_name = null
                    var album_id = null
                    var singer = [ ]
                    
                    for (var i=0; i!= c.length; ++i) {
                        if (c[i].getAttribute('data-res-name') != null) {
                            name = c[i].getAttribute('data-res-name')
                        }

                        if (!mv_id && (c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/mv?id=') != -1)) {
                            mv_id = c[i].getAttribute('href').match(/\d+/)
                            mv_id = mv_id.length > 0 && mv_id[0] || null
                        }

                        if (!album_id && (c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/album?id=') != -1)) {
                            album_name = c[i].text
                            album_id = c[i].getAttribute('href').match(/\d+/)
                            album_id = album_id.length > 0 && album_id[0] || null
                        }

                        if ((c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/artist?id=') != -1)) {
                            var author_name = c[i].text
                            var author_id = c[i].getAttribute('href').match(/\d+/)
                            if (author_id.length == 1) {
                                singer.push({ 'name': author_name, 'id': author_id[0] })
                            }
                        }
                    }

                    var c = window.contentFrame.document.getElementsByClassName('tit')

                    if (c.length > 0) {
                        var c2 = c[0].getElementsByClassName('subtit')
                        if (c2.length > 0) {
                            tname = c2[0].textContent
                        }
                    }

                    return {
                        'name': name,
                        'tname': tname,
                        'mv_id': mv_id,
                        'album_name': album_name,
                        'album_id': album_id,
                        'singer': singer
                    }
                });

                if (song_info == null || song_info == undefined || !song_info['name']) {
                    log('failed read song info')
                    response(common.makeFailedData('failed read song info'))
                } else {
                    var data = JSON.parse(msg)
                    log('load lyrics succeed')
                    response(common.makeLyricResponseData([
                        song_info,
                        {
                            'source': 'ntes',
                            'id': id,
                            'lrc': data['lrc'] != null && data['lrc']['lyric'] || null,
                            'tlrc': data['tlyric'] != null && data['tlyric']['lyric'] || null
                        }
                    ]))
                }
            }
            catch(e)
            {
                response(makeFailedData(e || 'err'))
            }

            setTimeout(function(){
                page.close();
            }, 100)
        };

        log('load lyrics start')

        page.evaluateJavaScript('(function(){var bd=NEJ.P,bI=bd("nej.ut"),bA=bd("nej.j"),bL=bd("nm.s"),bc,bO;bL.bnA=NEJ.C();bc=bL.bnA.bU(bI.fb);bc.cY=function(){this.df();var bZ="/api/song/lyric",cN={id:#ID#,lv:-1,tv:-1};this.EF=cN.id;bA.cG(bZ,{sync:false,type:"json",query:cN,method:"get",onload:this.bny.bi(this),onerror:this.bny.bi(this)})};bc.bny=function(be){console.log(JSON.stringify(be))};new bL.bnA})'.replace("#ID#", id))
    })
}

function readSearchResult() {
    var result = []

    var c = window.contentFrame.document.getElementsByClassName('srchsongst')

    if (c.length == 0) {
        result = { 'err': 'not find element "srchsongst"' }
    } else {
        var c_song = c[0].getElementsByClassName('w0')
        var c_singer = c[0].getElementsByClassName('w1')
        var c_album = c[0].getElementsByClassName('w2')

        if (c_song.length != c_singer.length || c_singer.length != c_album.length) {
            result = { 'err': 'elements array length not match' }
        } else {
            for (var i = 0; i != c_song.length; ++i) {
                // read song info
                var song_href = c_song[i].getElementsByTagName("a")[0].href
                var song_title = c_song[i].getElementsByTagName("b")[0].title

                // read singers info
                var singler = []

                var child = c_singer[i].childNodes
                
                if (child.length == 1) {
                    var names = child[0].innerText.split('/')
                    var c_a = c_singer[i].getElementsByTagName("a")
                    var href_info = {}

                    for (var j = 0; j != c_a.length; ++j) {
                        href_info[c_a[j].text] = c_a[j].href
                    }

                    for (var j = 0; j != names.length; ++j) {
                        var name = names[j]

                        if (href_info[name]) {
                            singler.push({ "href": href_info[name], 'text': name })
                        } else {
                            singler.push({ "href": null, 'text': name })
                        }
                    }
                }
                
                // read album info
                var album = c_album[i].getElementsByTagName("a")[0]

                result.push({ 
                    'href': song_href, 
                    'title': song_title, 
                    'singler': singler, 
                    'album_href': album.href, 
                    'album_title': album.title
                })
            }
        }
    }

    return result
}

exports.search = function (name, response) {
    var log = common.createLog('ntes:search', name)
    var url = 'http://music.163.com/#/search/m/?type=1&s=' + name
    url = encodeURI(url)
    log('open: ' + url)

    var page = common.createPage(url, function(status) {
        page.onConsoleMessage = function(msg, lineNum, sourceId) {
            console.log(msg, lineNum)
        }
        if (status != 'success') {
            log('failed')
            response(common.makeFailedData('failed to open page'))
            return
        } else {
            log('ok, try read page elements')

            // TODO : wait to read node "srchsongst"

            var rt = page.evaluate(readSearchResult)

            if (rt['err'] != null) {
                log("failed : " + rt['err'])
            } else {
                log('search succeed')
            }

            response(common.makeSearchResponseData(rt))
        }
    })
}
