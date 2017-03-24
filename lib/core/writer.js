var async = require('async')
var fs = require('fs')

var FileWriter = (function () {
    function FileWriter() {
        this.list = []
    }
    FileWriter.prototype.addTask = function (opt) {
        this.list.push(opt)
    }
    FileWriter.prototype.execute = function (callback) {
        var tasks = []

        this.list.forEach((e) => {
            tasks.push((cb) => {
                fs.writeFile(e.filename, e.content, (err) => { 
                    cb(err)
                })
            })
        })

        if (tasks.length > 0) {
            async.parallel(tasks, (err, results) => {
                callback(err)
            })
        } else {
            callback(null)
        }
    }
    return FileWriter;
}());

exports.FileWriter = FileWriter

var StdoutWriter = (function () {
    function StdoutWriter() {
        this.list = []
    }
    StdoutWriter.prototype.addTask = function (opt) {
        this.list.push(opt)
    }
    StdoutWriter.prototype.execute = function (callback) {
        var tasks = []

        this.list.forEach((e) => {
            if (e.info) {
                console.log(e.info)
            }
            console.log(e.content)
        })

        callback(null)
    }
    return StdoutWriter;
}());

exports.StdoutWriter = StdoutWriter