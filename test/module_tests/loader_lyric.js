var test = require('../test')
var type = process.argv[2]

test.assert(type, 'no loader name')

var loader = require(`../../lib/core/loader/${type}`)

test.assert(loader, 'invailed loader')

loader.search({ name: 'I' }, (result) => {
    test.assert(!result['err'], result['err'])
    test.assert(result['search'].length > 0, 'search results wrong')

    console.log('search results amount: ' + result['search'].length)
    
    loader.download({ id: result['search'][0].id }, (result) => {
        test.assert(!result['err'], result['err'])
        console.log(`frist result name: ${result.name}`)
        test.assert(result['lrc'], 'lrc not exists')
        process.exit(0)
    })
})