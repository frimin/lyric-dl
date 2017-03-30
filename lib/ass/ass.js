var STYLE_FORMAT = [
    // [name, key, default value]
    ['name', 'Name', null],
    ['fontName', 'Fontname', null],
    ['fontSize', 'Fontsize', '30'],
    ['primaryColour', 'PrimaryColour', '&H00FFFFFF'],
    ['secondarycolour', 'SecondaryColour', '&H3C000000'],
    ['outlineColour', 'OutlineColour', 'H00000000'],
    ['backColour', 'BackColour', 'H00000000'],
    ['bold', 'Bold', '0'],
    ['italic', 'Italic', '0'],
    ['underline', 'Underline', '0'],
    ['strikeOut', 'StrikeOut', '0'],
    ['scaleX', 'ScaleX', '100'],
    ['scaleY', 'ScaleY', '100'],
    ['spacing', 'Spacing', '0'],
    ['angle', 'Angle', '0'],
    ['borderStyle', 'BorderStyle', '0'],
    ['outline', 'Outline', '1'],
    ['shadow', 'Shadow', '0'],
    ['alignment', 'Alignment', '1'],
    ['marginL', 'MarginL', '0'],
    ['marginR', 'MarginR', '0'],
    ['marginV', 'MarginV', '0'],
    ['encoding', 'Encoding', '0']
]

var EVENT_STYLE_FORMAT = [
    ['layer' ,'Layer', '0'],
    ['start', 'Start', null],
    ['end', 'End', null],
    ['style', 'Style', null],
    ['actor', 'Actor', ''],
    ['MarginL','MarginL', '0000'],
    ['MarginR','MarginR', '0000'],
    ['MarginV','MarginV', '0000'],
    ['effect', 'Effect', ''],
    ['text', 'Text', ''],
]

exports.ASSLineAlignmentType = {
    'bottomLeft' : 1,
    'bottomCenter' : 2,
    'bottomRight' : 3,
    'middleLeft' : 4,
    'middleCenter' : 5,
    'middleRight' : 6,
    'topLeft' : 7,
    'topCenter' : 8,
    'topRight' : 9,
}

exports.ASSColorType = {
    'primary' : 1,
    'secondary' : 2,
    'border' : 3,
    'shadow' : 4,
}

function trySecConvertToAssTime(sec) {
    if (typeof(sec) == 'number') {
        var h = Math.floor(sec / 3600).toString()
        var s = sec % 3600
        var m = Math.floor(s / 60).toString()
        s = (s % 60).toString()

        if (m.length == 1) {
            m = '0' + m
        }

        var secNum = s.split('.')

        if (secNum.length == 1) {
            secNum[1] = '00'
        } else {
            if (secNum[1].length >= 2) {
                secNum[1] = secNum[1].substr(0, 2)
            } else {
                secNum[1] = secNum[1] + '0'
            }
        }

        if (secNum[0].length < 2) {
            secNum[0] = '0' + secNum[0]
        }

        s = secNum.join('.')

        var ret = `${h}:${m}:${s}`

        if (ret.length != 10) {
            throw `invalid time format: ${ret}`
        }

        return ret
    } else {
        return sec
    }
}

var ASSGenerator = (function () {
    function ASSGenerator(options) {
        options = options || {}

        this._lines = []

        if (this._head)
            throw 'you can\'t create ASS file head again' 

        this._head = {
            'title': options.title || 'untitled',
            'width': options.width || 1920,
            'height': options.height || 1080,
            'timer': options.timer || 0,
        }

        var head = this._head

        this._lines.push(`\
[Script Info]
Title: ${head.title}
ScriptType: v4.00+
Collisions: Normal
PlayResX: ${head.width}
PlayResY: ${head.height}
Timer: ${head.timer}
Synch Point: 0`)
    }

    ASSGenerator.prototype.createStyle = function (options) {
        if (!this._styles) {
            var styleNames = []

            STYLE_FORMAT.forEach((item) => {
                styleNames.push(item[1])
            })

            this._lines.push('\n[V4+ Styles]\nFormat: ' + styleNames.join(','))

            this._styles = []
        }

        this._styles.push(options)

        var vals = []

        STYLE_FORMAT.forEach((item) => {
            var valueName = item[0]

            if (options[valueName]) {
                vals.push(options[valueName])
            } else {
                if (item[2] == null) {
                    throw `style option "${item[0]}" no default value`
                }

                // use default value
                vals.push(item[2])
            }
        })

        this._lines.push('Style: ' + vals.join(','))
    }

    ASSGenerator.prototype.createEvent = function (options) {
        if (!this._events) {
            var styleNames = []

            EVENT_STYLE_FORMAT.forEach((item) => {
                styleNames.push(item[1])
            })

            this._lines.push('\n[Events]\nFormat: ' + styleNames.join(','))

            this._events = []
        }

        options.start = trySecConvertToAssTime(options.start)
        options.end = trySecConvertToAssTime(options.end)

        this._events.push(options)

        var vals = []

        EVENT_STYLE_FORMAT.forEach((item) => {
            var valueName = item[0]

            if (options[valueName]) {
                vals.push(options[valueName])
            } else {
                if (item[2] == null) {
                    throw `event option "${item[0]}" no default value`
                }

                // use default value
                vals.push(item[2])
            }
        })

        this._lines.push('Dialogue: ' + vals.join(','))
    }

    ASSGenerator.prototype.getContent = function () {
        return this._lines.join('\n')
    }
    
    ASSGenerator.prototype.debugPrint = function () {
        this._lines.forEach((v) => {
            console.log(v)
        })
    }

    ASSGenerator.prototype.toScreenPos = function (p) {
        return [Math.floor(p[0] * this._head.width), Math.floor(p[1] * this._head.height)]
    }

    ASSGenerator.prototype.toRelativePos = function (p0, p1) {
        if (p1 == null) {
            p1 = [ this._head.width, this._head.height ]
        }

        return [p0[0] / p1[0], p0[1] / p1[1]]
    }

    // effects

    ASSGenerator.prototype.moveEffect = function (p0, p1) {
        p0 = this.toScreenPos(p0)
        p1 = this.toScreenPos(p1)
        return `{\\move(${p0[0]},${p0[1]},${p1[0]},${p1[1]})}`
    }

    ASSGenerator.prototype.fadEffect = function(self, inTime, outTime) {
        if (outTime == null)
            outTime = inTime
        return `{\\fad(${inTime},${outTime})}`
    }

    return ASSGenerator;
}());

exports.ASSGenerator = ASSGenerator
