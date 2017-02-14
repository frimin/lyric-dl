var lyric_dl = require('../index')

var ntes = lyric_dl.getLoader('ntes')

ntes.search({ name: 'I' }, (ret) => {
    ret.search.forEach((e) => {
        ntes.download({ id: e.id }, (ret) => {
            console.log(JSON.stringify(ret))
        })
    })
})
