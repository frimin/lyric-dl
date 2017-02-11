#!/usr/bin/env sh

search_name="123"

test_start "search from ntes"
lyric-dl search $search_name -u -f ntes > $temp_dir/ntes_results
test_end

test_start "search from qq"
lyric-dl search $search_name -u -f qq > $temp_dir/qq_results
test_end

test_start "download from ntes"
cat $temp_dir/ntes_results | sed 3q | lyric-dl download - -d $temp_dir
test_end

test_start "download from qq"
cat $temp_dir/qq_results | sed 3q | lyric-dl download - -d $temp_dir
test_end
