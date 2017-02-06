/*
Copyright 2015, Yahoo Inc.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com, neraliu@gmail.com>
*/
(function () {

    require("mocha");
    var expect = require('chai').expect,
        testPatterns = require("../test-patterns.js"),
        TrieGenerator = require("../../src/trie-generator.js"),
        decoder = require("../../src/html-decoder.js"),
        trie = require("../../src/gen/trie.json");

    describe("HTML Entities Decoder test suite", function() {

        it("findString test", function() {
            // test for existence after build
            testPatterns.htmlEntities.forEach(function(testObj) {
                for (var key in testObj.o) {
                    var result = decoder._findString(trie, key.substring(1));
                    // console.log(key, decoder._findString(trie, key.substring(1)), testObj.o[key]);
                    if (typeof testObj.o[key] === 'undefined') {
                        expect(result).to.equal(undefined);
                    } else {
                        expect(result.c).to.equal(testObj.o[key].characters);
                    }
                }
            });
        });

        it("decoding test", function() {
            testPatterns.htmlEntitiesDecode.forEach(function(testObj) {
                var r = decoder.decode(testObj.str);
                // console.log(testObj.str, testObj.result, r);
                expect(r).to.equal(testObj.result);
            });
        });

        it("parse error decoding test", function() {
            testPatterns.htmlEntitiesParseErrorDecode.forEach(function(testObj) {
                var r = decoder.decode(testObj.str);
                expect(r).to.equal(testObj.result);
            });
        });
    });
}());
