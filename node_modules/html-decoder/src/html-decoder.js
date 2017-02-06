/* 
Copyright 2015, Yahoo Inc.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com, neraliu@gmail.com>
*/
/*jshint -W030 */
(function () {
"use strict";

require('./polyfills/polyfill.js');
var trie = require('./gen/trie.json'),
    matchTrace,
    HTMLDecoder = {};

/////////////////////////////////////////////////////
//
// PUBLIC API
// 
/////////////////////////////////////////////////////

/**
* @function HTMLDecoder#decode
*
* @description
* HTML decode the character
*
* Reference:
* https://html.spec.whatwg.org/multipage/syntax.html#tokenizing-character-references
*/
HTMLDecoder.reCharReferenceDecode = /&([a-z]{2,31}\d{0,2};?)|&#0*(x[a-f0-9]+|[0-9]+);?/ig;
HTMLDecoder.decode = function(str) {
    var num, r;

    return str.replace(HTMLDecoder.reCharReferenceDecode, function(m, named, number) {
        if (named) {
            r = HTMLDecoder._findString(trie, named);
            return r ? r.c + (r.u || '') : m;
        } else {
            num = parseInt(number[0] <= '9' ? number : '0' + number); // parseInt('0xA0') is equiv to parseInt('A0', 16)
            return num === 0x00 ? '\uFFFD' // REPLACEMENT CHARACTER    
                       : num === 0x80 ? '\u20AC'  // EURO SIGN (€)
                       : num === 0x82 ? '\u201A'  // SINGLE LOW-9 QUOTATION MARK (‚)
                       : num === 0x83 ? '\u0192'  // LATIN SMALL LETTER F WITH HOOK (ƒ)
                       : num === 0x84 ? '\u201E'  // DOUBLE LOW-9 QUOTATION MARK („)
                       : num === 0x85 ? '\u2026'  // HORIZONTAL ELLIPSIS (…)
                       : num === 0x86 ? '\u2020'  // DAGGER (†)
                       : num === 0x87 ? '\u2021'  // DOUBLE DAGGER (‡)
                       : num === 0x88 ? '\u02C6'  // MODIFIER LETTER CIRCUMFLEX ACCENT (ˆ)
                       : num === 0x89 ? '\u2030'  // PER MILLE SIGN (‰)
                       : num === 0x8A ? '\u0160'  // LATIN CAPITAL LETTER S WITH CARON (Š)
                       : num === 0x8B ? '\u2039'  // SINGLE LEFT-POINTING ANGLE QUOTATION MARK (‹)
                       : num === 0x8C ? '\u0152'  // LATIN CAPITAL LIGATURE OE (Œ)
                       : num === 0x8E ? '\u017D'  // LATIN CAPITAL LETTER Z WITH CARON (Ž)
                       : num === 0x91 ? '\u2018'  // LEFT SINGLE QUOTATION MARK (‘)
                       : num === 0x92 ? '\u2019'  // RIGHT SINGLE QUOTATION MARK (’)
                       : num === 0x93 ? '\u201C'  // LEFT DOUBLE QUOTATION MARK (“)
                       : num === 0x94 ? '\u201D'  // RIGHT DOUBLE QUOTATION MARK (”)
                       : num === 0x95 ? '\u2022'  // BULLET (•)
                       : num === 0x96 ? '\u2013'  // EN DASH (–)
                       : num === 0x97 ? '\u2014'  // EM DASH (—)
                       : num === 0x98 ? '\u02DC'  // SMALL TILDE (˜)
                       : num === 0x99 ? '\u2122'  // TRADE MARK SIGN (™)
                       : num === 0x9A ? '\u0161'  // LATIN SMALL LETTER S WITH CARON (š)
                       : num === 0x9B ? '\u203A'  // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK (›)
                       : num === 0x9C ? '\u0153'  // LATIN SMALL LIGATURE OE (œ)
                       : num === 0x9E ? '\u017E'  // LATIN SMALL LETTER Z WITH CARON (ž)
                       : num === 0x9F ? '\u0178'  // LATIN CAPITAL LETTER Y WITH DIAERESIS (Ÿ)
                       : HTMLDecoder.frCoPt(num);
        }
    });
};

/**
* @function HTMLEntites#frCoPt
*
* @description
* Convert the code point to character except those numeric range will trigger the parse error in HTML decoding.
* https://html.spec.whatwg.org/multipage/syntax.html#tokenizing-character-references  
*/
HTMLDecoder.frCoPt = function(num) {
    return !isFinite(num) ||                  // `NaN`, `+Infinity`, or `-Infinity`
        num <= 0x00 ||                        // NULL or not a valid Unicode code point
        num > 0x10FFFF ||                     // not a valid Unicode code point
        (num >= 0xD800 && num <= 0xDFFF) || 
        (num >= 0x01 && num <= 0x08) ||
        (num >= 0x0D && num <= 0x1F) ||
        (num >= 0x7F && num <= 0x9F) ||       // NOTE: the spec may be wrong as 0x9F returns U+0178
        (num >= 0xFDD0 && num <= 0xFDEF) ||

        num === 0x0B ||
        (num & 0xFFFF) === 0xFFFF ||
        (num & 0xFFFF) === 0xFFFE ? '\uFFFD' : String.fromCodePoint(num);
};

/////////////////////////////////////////////////////
//
// INTERAL API
// 
/////////////////////////////////////////////////////


/**
* @function HTMLDecoder#_findString
*
* @description
*/
HTMLDecoder._findString = function(trie, str, pos) {
    /* init the trace */
    if (!pos) {
        pos = 0;
        matchTrace = [];
    }

    var index = str[pos], l, r;

    if (trie[index] === null || trie[index] === undefined) { // end of trie
        if (matchTrace.length > 0) { // return the last longest matched pattern, else return undefined
            r = {
                c: matchTrace[matchTrace.length-1].c,
                u: matchTrace[matchTrace.length-1].u
            };
        }
        return r;
    } else if (pos+1 === str.length) { // end of string
        if (trie[index][0] !== null && trie[index][0] !== undefined) {
            r = {c: trie[index][0]};
        } else if (matchTrace.length > 0) { // return the last longest matched pattern, else return undefined
            r = {
                c: matchTrace[matchTrace.length-1].c,
                u: matchTrace[matchTrace.length-1].u
            };
        }
        return r;
    } else {
        if (trie[index][0] !== null && trie[index][0] !== undefined) {
            matchTrace.push({
              u: str.substr(pos+1), 
              c: trie[index][0]
            });
        }
        return HTMLDecoder._findString(trie[index], str, pos+1);
    }
};

module.exports = HTMLDecoder;

})();
