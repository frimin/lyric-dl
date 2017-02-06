HTML Decoder
===============================
The first HTML5 compliant HTML decoder. This decoder is implemented based on the <a href="https://html.spec.whatwg.org/multipage/syntax.html#tokenizing-character-references">HTML5 specification</a> and can decode the full named character reference list based on this <a href="https://html.spec.whatwg.org/multipage/entities.json">json</a>.

## Quick Start

Install the npm html-decoder from the npm repo.
```sh
npm install html-decoder
```

### Server-side Use (node.js)

Decoding a string with numeric and named character reference.

```js
/* create the html decoder */
var HTMLDecoder = require("html-decoder");
decoder = new HTMLDecoder();

var htmlString = "&gt;&gt&gta ...";
/* html = '<<<a...'; */
var html = decoder.decode(htmlString);
```

## Development

### Build

```sh
grunt
```

### How to test
```sh
grunt test
```

## Maintenance

### Generate from WHATWG
```sh
grunt gen
```

## OR doing it manually

### Get the latest named character reference json.
```sh
wget https://html.spec.whatwg.org/multipage/entities.json
```

### Generate the trie.
```sh
# $REPO_HOME is the home directory of this repo.
cp entities.json $REPO_HOME/data 

# the output is saved @ src/gen/trie.js
./bin/genhtmlentities data/entities.json
```

### Test the build again.
```sh
grunt test
```

### Future works

## License

This software is free to use under the BSD license.
See the [LICENSE file](./LICENSE) for license text and copyright information.
