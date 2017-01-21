var common = require(phantom.libraryPath + '/core/common.js')

function loadLyric(id, page, done) {
    page.onConsoleMessage = function (msg, lineNum, sourceId) {
        try {
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
                return done(false, page, 'failed read song info')
            } else {
                var data = JSON.parse(msg)
                return done(true, page, [
                    song_info,
                    {
                        'source': 'ntes',
                        'id': id,
                        'lrc': data['lrc'] != null && data['lrc']['lyric'] || null,
                        'tlrc': data['tlyric'] != null && data['tlyric']['lyric'] || null
                    }
                ])
            }
        }
        catch(e)
        {
            done(false, page, e || 'err')
        }
    }

    page.evaluateJavaScript('(function(){var bd=NEJ.P,bI=bd("nej.ut"),bA=bd("nej.j"),bL=bd("nm.s"),bc,bO;bL.bnA=NEJ.C();bc=bL.bnA.bU(bI.fb);bc.cY=function(){this.df();var bZ="/api/song/lyric",cN={id:#ID#,lv:-1,tv:-1};this.EF=cN.id;bA.cG(bZ,{sync:false,type:"json",query:cN,method:"get",onload:this.bny.bi(this),onerror:this.bny.bi(this)})};bc.bny=function(be){console.log(JSON.stringify(be))};new bL.bnA})'.replace("#ID#", id))    
}

exports.downloadLyric = function (log, id, response) {
    var url = 'http://music.163.com/#/m/song?id=' + id
    log('open: ' + url)

    common.async.series([
        function (done) {
            var page = common.createPage(url, function(status) {
                if (status != 'success') {
                    done(false, page, 'failed to open page')
                } else {
                    done(true, page)
                }
            })
        },
        function (done, page) {
            log('try load lyrics')

            common.async.waitFor({
                'check': function() {
                    return page.evaluate(function() {
                        try {
                            if (NEJ) return true 
                        } catch (e) {
                            return false 
                        }
                    })
                },
                'timeout': function() {
                    done(false, page, 'load lyrics timeout')  
                },
                'done': function() {
                    done(true, page)     
                }
            })
        },
        function (done, page) {
            loadLyric(id, page, done)
        },
    ], function(succeed, page, result) {
        if (succeed) {
            log('succeed')
            response(common.makeLyricResponseData(result))
        } else {
            log(result)
            response(common.makeFailedData(result))
        }

        setTimeout(function(){
            page.close();
        }, 100) 
    })
}

function loadSearchResult() {
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
                            singler.push({ "href": href_info[name], 'name': name })
                        } else {
                            singler.push({ "href": null, 'name': name })
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

    common.async.series([
        function (done) {
            var page = common.createPage(url , function(status) {
                if (status != 'success') {
                    done(false, page, 'failed to open page')
                } else {
                    done(true, page)
                }
            })
        },
        
        function (done, page) {
            log('try load search result')

            common.async.waitFor({
                'check': function() {
                    return page.evaluate(function() {
                        var c = window.contentFrame.document.getElementsByClassName('srchsongst')
                        var rt = null
                        if (c.length == 1) { 
                            rt = true 
                        } else { 
                            rt = false
                        }
                        return rt
                    })
                },
                'timeout': function() {
                    done(false, page, 'load result timeout')  
                },
                'done': function() {
                    var rt = page.evaluate(loadSearchResult)

                    if (rt['err'] != null) {
                        done(false, page, 'failed : ' + rt['err'])
                    } else {
                        done(true, page, rt)
                    }        
                }
            })
        },
    ], function(succeed, page, result) {
        if (succeed) {
            log('succeed')
            response(common.makeSearchResponseData(result))
        } else {
            log(result)
            response(common.makeFailedData(result))
        }

        setTimeout(function(){
            page.close();
        }, 100)
    })
}
