var common = require(phantom.libraryPath + '/core/common.js')

exports.downloadLyric = function (id, response) {
	var log = common.createLog('qq:lyric', id)
	var url = "https://y.qq.com/portal/song/" + id + '.html'
	log('open: ' + url)
	var page = common.createPage(url, function(status) {
		if (status != 'success') {
			log('failed')
			response(common.makeFailedData('failed to open page'))
			return
		} else {
			log('ok')
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
			} else {
				log('ok')
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
					player_page.render('player_falied_screenshot.png');
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
					log('load lyrics succeed')

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