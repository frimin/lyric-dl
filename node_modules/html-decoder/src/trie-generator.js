/* 
Copyright 2015, Yahoo Inc.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com, neraliu@gmail.com>
*/
/*jshint -W030 */
(function () {
"use strict";

var fs = require('fs');

/////////////////////////////////////////////////////
//
// @module TrieGenerator
// 
/////////////////////////////////////////////////////
function TrieGenerator() {
    this.trie = {};
}

/////////////////////////////////////////////////////
//
// TRIE GENERATION API
// 
/////////////////////////////////////////////////////

/**
* @function HTMLEntites#build
*
* @description
*/
TrieGenerator.prototype.build = function(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var info = obj[key];
            this._addStringToTrie(this.trie, key, info);
        }
    }
    return this.trie;
};

/**
* @function TrieGenerator#save
*
* @description
* Save the trie in json format.
*/
TrieGenerator.prototype.save = function(file) {
    /* NOTE: JSON.stringify convert undefined to null */
    var json = JSON.stringify(this.trie);
    fs.writeFileSync(file, json);
};

/////////////////////////////////////////////////////
//
// INTERAL API
// 
/////////////////////////////////////////////////////

/**
* @function TrieGenerator#_addStringToTrie
*
* @description
*/
TrieGenerator.prototype._addStringToTrie = function(trie, str, info) {
    var l = str.length;
    var rootTrie = trie;

    for(var i=1;i<l;++i) {
     
        var isLastElement = (i === l-1);
        var childTrie = this._addCharToTrie(rootTrie, str[i], info, isLastElement);
        rootTrie = childTrie;
    }
};

/**
* @function TrieGenerator#_addCharToTrie
*
* @description
*/
TrieGenerator.prototype._addCharToTrie = function(trie, c, info, isLastElement) {
    var index = c;
    if (typeof trie[index] === 'undefined') {
        trie[index] = {};
    }
    // we need to carry only the characters
    if (isLastElement)
        trie[index][0] = info.characters;
    return trie[index];
};

/* exposing it */
module.exports = TrieGenerator;

})();
