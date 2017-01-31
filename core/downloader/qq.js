var common = require(phantom.libraryPath + '/core/common.js')

exports.downloadLyric = function (log, id, response) {
	var url = "https://y.qq.com/portal/song/" + id + '.html'
	log('open: ' + url)
	var page = common.createPage(url, function(status) {
		if (status != 'success') {
			log('failed')
			response(common.makeFailedData('failed to open page'))
			return
		}

		var g_SongData = page.evaluate(function(){
			return window.g_SongData
		})

		// log('info: ' + JSON.stringify(g_SongData))

		if (!g_SongData) {
			response(common.makeFailedData('no song data'))
			return
		}

		var baseData = {
            'source': 'qq',
			'id': g_SongData['singermid'],
			'name': g_SongData['songname'],
			'tname': g_SongData['songtitle'],
			'album_id': g_SongData['albummid'],
			'album_name': g_SongData['albumname'],
			'singer': [],
		}

		for (i in g_SongData['singer']) {
			var s = g_SongData['singer'][i]
			baseData['singer'][i] = { 'id': s['mid'], 'name': s['name'] }
		}

		page.evaluate(function(g_SongData) {
			localStorage.clear()
			localStorage.setItem("y_playlist", JSON.stringify([ g_SongData ]))
		}, g_SongData)

		page.evaluate(function() {
			var e = document.getElementsByClassName("js_all_play")
			e[0].click()
		})

		var url = 'https://y.qq.com/portal/player.html'

		log('open: ' + url)

		var player_page = common.createPage(url, function(status) {
			if (status != 'success') {
				log('failed')
				response(common.makeFailedData('failed to open page'))
				return
			}
			
			var timeusage = 0

			function try_get_lyrics() {
				player_page.evaluate(function() { 
					var btn = document.getElementById("btnplay")
					if (btn != null) {
						document.getElementById("btnplay").click() 
					} // may loading page
				})

				if (timeusage > 5000) {
					log('load lyrics timeout')
					response(common.makeFailedData('load lyrics timeout'))
					setTimeout(function(){
						player_page.close();
					}, 100)
					return
				}

				var lrc = player_page.evaluate(function(id){
					var data = window.top['qqmusic_lyrics_lrc' + id]
					if (data) {
						data = require("js/common/module/coder.js").Base64.decode(data)
					}
					return data
				}, id)

				var tlrc = player_page.evaluate(function(id){
					var data = window.top['qqmusic_lyrics_trans' + id]
					if (data) {
						data = require("js/common/module/coder.js").Base64.decode(data) 
					}
					return data
				}, id)

				if (lrc) {
					if (lrc.indexOf('[00:00:00]此歌曲为没有') != -1) {
						lrc = null
					}

					response(common.makeLyricResponseData([ baseData, { 'lrc': lrc, 'tlrc': tlrc } ]))
					setTimeout(function(){
						player_page.close();
					}, 100)
				} else {
					timeusage += 100
					setTimeout(try_get_lyrics, 100)
				}
			}

			try_get_lyrics()
		})
	}, page)
}

function loadSearchResult() {
    var result = []

    var c = document.getElementsByClassName('mod_songlist')

    if (c.length == 0) 
        return { 'err': 'not find element "mod_songlist"' }

    try {
        var songlist = null

        var child = c[0].children

        for (var i = 0; i != child.length; i++) {
            if (!songlist && child[i].className == 'songlist__list') {
                songlist = child[i]
            }
        }
        
        if (!songlist)
            return { 'err': 'not find element "songlist"' }

        var lists = songlist.children

        for (var i = 0; i != lists.length; i++) {
            var song_info = { 'singler' : [] }

            var item = lists[i].children[0]

            if (!item) {
                throw 'not found element "songlist__item", idx:' + i
            }
            
            var propList = item.children // songlist__item

            for (var j = 0; j != propList.length; j++) {
                var prop = propList[j]
                
                if (prop.className.indexOf('songname') > 0) {
                    var c_a = prop.getElementsByTagName('a')
                    var a = c_a[0]

                    if (!a || a.className != 'js_song')
                        throw 'failed to read songname'

                    song_info['href'] = a.href
                    song_info['title'] = a.title
                } else if (prop.className.indexOf('artist') > 0) {
                    var c_a = prop.getElementsByTagName('a')

                    for (var k = 0; k != c_a.length; k++) {
                        if (c_a[k].className == 'singer_name') {
                            song_info['singler'].push({ 'href': c_a[k].href, 'name': c_a[k].title })
                        }
                    }
                } else if (prop.className.indexOf('album') > 0) {
                    var c_a = prop.getElementsByTagName('a')
                    var a = c_a[0]

                    if (!a || a.className != 'album_name')
                        throw 'failed to read album'

                    song_info['album_href'] = a.href
                    song_info['album_title'] = a.title
                }
            }

            result.push(song_info)
        }

    } catch (e) {
        return {'err': e}
    }

    return result
}

exports.search = function (log, name, response) {
    var url = 'https://y.qq.com/portal/search.html#page=1&searchid=1&t=song&w=' + name
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
            common.async.waitFor({
                'check': function() {
                    return page.evaluate(function() {
                        return document.getElementsByClassName('mod_songlist').length > 0
                        || document.getElementById('none_box').style['display'] == ''
                    })
                },
                'timeout': function() {
                    done(false, page, 'load result timeout')  
                },
                'done': function() {
                    var noResult = page.evaluate(function() {
                        return document.getElementById('none_box').style['display'] == ''
                    })

                    if (noResult)
                        return done(false, page, 'failed : no search result')
                        
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
            response(common.makeSearchResponseData(result))
        } else {
            response(common.makeFailedData(result))
        }

        setTimeout(function(){
            page.close();
        }, 10)
    })
}
