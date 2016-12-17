var common = require(phantom.libraryPath + '/core/common.js')

exports.download = function (id, response) {
	var log = common.createLog('ntes', id)
	var url = 'http://music.163.com/#/m/song?id=' + id
	log('open: ' + url)
	var page = common.createPage(url, function(status) {
		log('ok')
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
					response(common.makeResponseData([
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