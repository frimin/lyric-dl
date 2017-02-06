/*
Copyright 2015, Yahoo Inc.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com, neraliu@gmail.com>
*/
(function () {

    require("mocha");
    require("../../src/polyfills/polyfill.js");
    var expect = require('chai').expect,
        testPatterns = require("../test-patterns.js"),
        TrieGenerator = require("../../src/trie-generator.js"),
        decoder = require("../../src/html-decoder.js"),
        trie = require("../../src/gen/trie.json");

    describe("HTML Entities Trie Generator test suite", function() {

        function inspectTrie(trie, arr, codepoint, currDepth) {
            var tested = trie[arr[currDepth]];

            // console.log(currDepth, arr[currDepth], arr, codepoint);
            // console.log(' ', tested);

            if (typeof tested === 'undefined') {
                expect(codepoint).to.equal(undefined);
            } else if(currDepth < arr.length - 1) {
                inspectTrie(trie[arr[currDepth]], arr, codepoint, currDepth+1);
            } else {
                // test for codepoints
                expect(tested[0]).to.equal(String.fromCodePoint.apply(String, codepoint));
            }
        }

        it("correctness of trie test", function() {
            testPatterns.htmlEntities.forEach(function(testObj) {
                inspectTrie(trie, testObj.result.paths, testObj.result.codepoints, 0);
            });
        });

        it("html5 full entities test", function() {
            var trie, 
                trieGenerator = new TrieGenerator(),
                srcEntities = require("../../data/entities.json");

            // build the tree
            trie = trieGenerator.build(srcEntities);

            for (var key in srcEntities) {
                if (srcEntities.hasOwnProperty(key)) {
                    var info = srcEntities[key];
                    var r = decoder._findString(trie, key.substring(1));
                    expect(r.c).to.equal(info.characters);
                }
            }

            testPatterns.htmlEntitiesFindString.forEach(function(testObj) {
                var r = decoder._findString(trie, testObj.str.substring(1));
                expect(r).to.deep.equal(testObj.result);
            });
        });

    });

}());
