
exports.waitFor = function(callbacks, timeout, stepTime) {
    var timeusage = 0

    timeout = timeout || 5000
    stepTime = stepTime || 100

    function step() {
        if (timeusage > timeout) {
            if (callbacks['timeout']) {
                callbacks['timeout']()
            }
            return
        }

        var b = callbacks['check']()

        if (b) {
            if (callbacks['done']) {
                callbacks['done']()
            }
            return
        } else {
            timeusage += stepTime
            setTimeout(step, stepTime)
        }
    }

    step()
}

exports.series = function (callbackList, finishCallback) {
    var iter = 0 
    var length = callbackList.length

    if (!length) {
        return finishCallback(false, 'callback list attribute "length" not exists')
    }

    function done(ok, _1, _2, _3, _4, _5) {
        if (!ok) {
            return finishCallback(false, _1, _2, _3, _4, _5)
        }

        iter++
        
        if (iter == length) {
            return finishCallback(true, _1, _2, _3, _4, _5)
        }

        callbackList[iter](done, _1, _2, _3, _4, _5)
    }
    
    callbackList[iter](done)
}