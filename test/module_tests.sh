#!/usr/bin/env sh

test_start "ntes loader"
node test/module_tests/loader_lyric.js ntes
test_end

test_start "qq loader"
node test/module_tests/loader_lyric qq
test_end