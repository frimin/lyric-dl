**lyric-dl** 是一个下载在线音乐歌词的命令行工具，它是一个 Node.js 程序，在使用它之前你必须安装 [Node.js](https://nodejs.org/en/)


在使用脚本之前先为其添加可执行权限

	chmod u+x lyric-dl

# 使用

命令格式

	lyric-dl [命令 [参数 [参数 ...]]] [选项]

拥有一个歌曲地址，可以通过 URL 来下载歌词，以 JSON 格式输出以获取歌曲信息

	./lyric-dl download <url> --out-format json

通过歌曲名来获取搜索结果

	./lyric-dl search <name> --all

组合命令可以批量下载搜索结果的歌词

	./lyric-dl search <name> --url --output urllist && cat urllist | ./lyric-dl download - --dir .

 目前支持的链接格式：

* **网易云音乐 (ntes)** : http://music.163.com/#/m/song?id=XXXXXX

# WebAPI

工具内建了一个简易的 WebServer 提供了 WebAPI 以 JSON 格式返回数据。启动 WebServer:

	./lyric-dl server

# 获得其它帮助内容
	./lyric-dl --help
