/*
Copyright 2015, Yahoo Inc.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
(function() {

var htmlEntities = [
    { o: { "&A;":        undefined }, result: { paths: ['A',';'], codepoints: undefined } },
    { o: { "&Aa;":       undefined }, result: { paths: ['A','a',';'], codepoints: undefined } },
    // { o: { "&A;":        { "codepoints": undefined, "characters": undefined } }, result: { paths: ['A',';'], codepoints: undefined } },
    // { o: { "&Aa;":       { "codepoints": undefined, "characters": undefined } }, result: { paths: ['A','a',';'], codepoints: undefined } },

    { o: { "&Aacute;":   { "codepoints": [193], "characters": "\u00C1" } }, result: { paths: ['A','a','c','u','t','e',';'], codepoints: [193] } },
    { o: { "&Aacute":    { "codepoints": [193], "characters": "\u00C1" } }, result: { paths: ['A','a','c','u','t','e'], codepoints: [193] } },
    { o: { "&acE;":      { "codepoints": [8766, 819], "characters": "\u223E\u0333" } }, result: { paths: ['a','c','E',';'], codepoints: [8766, 819] } },
    { o: { "&cent":      { "codepoints": [162], "characters": "\u00A2" } }, result: { paths: ['c','e','n','t'], codepoints: [162] } },
    { o: { "&cent;":     { "codepoints": [162], "characters": "\u00A2" } }, result: { paths: ['c','e','n','t',';'], codepoints: [162] } },
    { o: { "&centerdot;":{ "codepoints": [183], "characters": "\u00B7" } }, result: { paths: ['c','e','n','t','e','r','d','o','t',';'], codepoints: [183] } },
];
exports.htmlEntities = htmlEntities;

/* for the pattern cannot be found */
var htmlEntitiesFindString = [
    { str: '&SmallCircle;', result: { c: '∘' } },
    { str: '&SmallCircle',  result: undefined },
    { str: '&XXX',          result: undefined },

    /* throw error as expected
    { str: '&\ufffd',       result: undefined },
    */
];
exports.htmlEntitiesFindString = htmlEntitiesFindString;

// var htmlEntitiesEncode = [
//     { str: 'abcdefghijklmnop', result: '&#97;&#98;&#99;&#100;&#101;&#102;&#103;&#104;&#105;&#106;&#107;&#108;&#109;&#110;&#111;&#112;' },
//     { str: 'ABCDEFGHIJKLMNOP', result: '&#65;&#66;&#67;&#68;&#69;&#70;&#71;&#72;&#73;&#74;&#75;&#76;&#77;&#78;&#79;&#80;' },
//     { str: '0123456789',       result: '&#48;&#49;&#50;&#51;&#52;&#53;&#54;&#55;&#56;&#57;' },
//     { str: '\u0024',           result: '&#36;' },
//     { str: '\u20ac',           result: '&#8364;' },
//     { str: '\u10437',          result: '&#4163;&#55;' },
//     { str: '\u24B62',          result: '&#9398;&#50;' },

//     { str: '\uD852\uDF62',     result: '&#150370;' },
//     { str: '\uD801\uDC37',     result: '&#66615;' },
//     { str: '\uDBFF\uDC00',     result: '&#1113088;' },

//     { str: '\uFFFF\uDC00',     result: '&#65535;&#56320;' },
//     { str: '\uD800\uDC00',     result: '&#65536;' },

//     // out of range, skip one char
//     { str: '\uDC00\uDC00',     result: '&#56320;&#56320;' },
//     { str: '\uDFFF\uDC00',     result: '&#57343;&#56320;' },
// ];
// exports.htmlEntitiesEncode = htmlEntitiesEncode;

var htmlEntitiesDecode = [
    { str: '&#97;&#98;&#99;&#100;&#101;&#102;&#103;&#104;&#105;&#106;&#107;&#108;&#109;&#110;&#111;&#112;',       result: 'abcdefghijklmnop' },
    { str: '&#65;&#66;&#67;&#68;&#69;&#70;&#71;&#72;&#73;&#74;&#75;&#76;&#77;&#78;&#79;&#80;',                    result: 'ABCDEFGHIJKLMNOP' },
    { str: '&#48;&#49;&#50;&#51;&#52;&#53;&#54;&#55;&#56;&#57;',                                                  result: '0123456789'       },
    { str: '&#x61;&#x62;&#x63;&#x64;&#x65;&#x66;&#x67;&#x68;&#x69;&#x6a;&#x6b;&#x6c;&#x6d;&#x6e;&#x6f;&#x70;',    result: 'abcdefghijklmnop' },
    { str: '&#x41;&#x42;&#x43;&#x44;&#x45;&#x46;&#x47;&#x48;&#x49;&#x4a;&#x4b;&#x4c;&#x4d;&#x4e;&#x4f;&#x50;',    result: 'ABCDEFGHIJKLMNOP' },
    { str: '&#x30;&#x31;&#x32;&#x33;&#x34;&#x35;&#x36;&#x37;&#x38;&#x39;',                                        result: '0123456789'       },

    { str: '&#150370;',       result: '\uD852\uDF62' }, 
    { str: '&#66615;',        result: '\uD801\uDC37' }, 
    { str: '&#1113088;',      result: '\uDBFF\uDC00' },
    { str: '&#65535;',        result: '\uFFFD' },
    { str: '&#65536;',        result: '\uD800\uDC00' },

    { str: '&#000065536;',    result: '\uD800\uDC00' },
    { str: '&#65536',         result: '\uD800\uDC00' },

    { str: '&#x24B62;',       result: '\uD852\uDF62' }, 
    { str: '&#x10437;',       result: '\uD801\uDC37' }, 
    { str: '&#x10FC00;',      result: '\uDBFF\uDC00' },
    { str: '&#xFFFF;',        result: '\uFFFD' },
    { str: '&#x10000;',       result: '\uD800\uDC00' },

    { str: '&#x000010000;',   result: '\uD800\uDC00' },
    { str: '&#x010000',       result: '\uD800\uDC00' },

    // out of range
    { str: '&#56320;',        result: '\uFFFD' },
    { str: '&#57343;',        result: '\uFFFD' },

    // named character reference
    { str: '&aelig;',         result: '\u00E6' },
    { str: '&Afr;',           result: '\uD835\uDD04' },
    { str: '&NewLine;',       result: '\u000A' },
    { str: '&bne;',           result: '\u003D\u20E5' },
    { str: '&CounterClockwiseContourIntegral;',           result: '\u2233' },

    { str: '&Uuml;',          result: '\u00DC' },
    { str: '&Uuml',           result: '\u00DC' },

    { str: '&NewLine',        result: '&NewLine'  },
    { str: '&newLine;',       result: '&newLine;' },

    { str: 'abcdefg&NewLine;hijklmnop',      result: 'abcdefg\u000Ahijklmnop' },
    { str: 'abcdefg&NewLinehijklmnop',       result: 'abcdefg&NewLinehijklmnop' },

    { str: '&#xGGGG;',        result: '&#xGGGG;' },
    { str: '&000gt;',         result: '&000gt;' },
    { str: '&xgt;',           result: '&xgt;' },

    { str: '&gta',            result: '>a' },
    { str: '&gt;',            result: '>'  },
    { str: '&gt',             result: '>'  },

    { str: '&gb',             result: '&gb'   },
    { str: '&gb;',            result: '&gb;'  },

    { str: '&cent',           result: '\u00A2'    },
    { str: '&cent;',          result: '\u00A2'    },
    { str: '&centerdot;',     result: '\u00B7'    },
    { str: '&centedot;',      result: '\u00A2edot;'    },
];
exports.htmlEntitiesDecode = htmlEntitiesDecode;

var htmlEntitiesParseErrorDecode = [
    { str: '&#x80;',          result: '\u20AC' },
    { str: '&#x82;',          result: '\u201A' },
    { str: '&#x83;',          result: '\u0192' },
    { str: '&#x84;',          result: '\u201E' },
    { str: '&#x85;',          result: '\u2026' },
    { str: '&#x86;',          result: '\u2020' },
    { str: '&#x87;',          result: '\u2021' },
    { str: '&#x88;',          result: '\u02C6' },
    { str: '&#x89;',          result: '\u2030' },
    { str: '&#x8A;',          result: '\u0160' },
    { str: '&#x8B;',          result: '\u2039' },
    { str: '&#x8C;',          result: '\u0152' },
    { str: '&#x8E;',          result: '\u017D' },
    { str: '&#x91;',          result: '\u2018' },
    { str: '&#x92;',          result: '\u2019' },
    { str: '&#x93;',          result: '\u201C' },
    { str: '&#x94;',          result: '\u201D' },
    { str: '&#x95;',          result: '\u2022' },
    { str: '&#x96;',          result: '\u2013' },
    { str: '&#x97;',          result: '\u2014' },
    { str: '&#x98;',          result: '\u02DC' },
    { str: '&#x99;',          result: '\u2122' },
    { str: '&#x9A;',          result: '\u0161' },
    { str: '&#x9B;',          result: '\u203A' },
    { str: '&#x9C;',          result: '\u0153' },
    { str: '&#x9E;',          result: '\u017E' },
    { str: '&#x9F;',          result: '\u0178' },

    { str: '&#000;',          result: '\uFFFD' },
    { str: '&#x000;',         result: '\uFFFD' },

    { str: '&#x110000;',      result: '\uFFFD' },
    { str: '&#xD800;',        result: '\uFFFD' },
    { str: '&#xDFFF;',        result: '\uFFFD' },
    { str: '&#x01;',          result: '\uFFFD' },
    { str: '&#x08;',          result: '\uFFFD' },
    { str: '&#x0D;',          result: '\uFFFD' },
    { str: '&#x1F;',          result: '\uFFFD' },
    { str: '&#x7F;',          result: '\uFFFD' },
    { str: '&#x9F;',          result: '\u0178' },
    { str: '&#xFDD0;',        result: '\uFFFD' },
    { str: '&#xFDEF;',        result: '\uFFFD' },
    { str: '&#x0B;',          result: '\uFFFD' },

    { str: '&#xFFFF;',        result: '\uFFFD' },
    { str: '&#x1FFFF;',       result: '\uFFFD' },
    { str: '&#x11FFFF;',      result: '\uFFFD' },
    { str: '&#xFFFE;',        result: '\uFFFD' },
    { str: '&#x1FFFE;',       result: '\uFFFD' },
    { str: '&#x11FFFE;',      result: '\uFFFD' },

    { str: '&#\u0000;',       result: '&#\u0000;' },
];
exports.htmlEntitiesParseErrorDecode = htmlEntitiesParseErrorDecode;

})();
