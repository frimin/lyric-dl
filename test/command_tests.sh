#!/usr/bin/env sh

search_name="123"

export DEBUG='*'

test_case "search from ntes"
lyric-dl search $search_name --output-url -f ntes > "$temp_dir/ntes_results"
test_end

test_case "check ntes result amount"
ntes_results=($(cat "$temp_dir/ntes_results"))
[[ ${#ntes_results[@]} -eq 30 ]]
test_end

test_case "search from qq"
lyric-dl search $search_name --output-url -f qq > $temp_dir/qq_results
test_end

test_case "check qq result amount"
qq_results=($(cat "$temp_dir/qq_results"))
[[ ${#qq_results[@]} -eq 20 ]]
test_end

test_case "search from xiami"
lyric-dl search $search_name --output-url -f xiami > $temp_dir/xiami_results
test_end

test_case "check xiai result amount"
xiami_results=($(cat "$temp_dir/xiami_results"))
[[ ${#xiami_results[@]} -eq 20 ]]
test_end

test_case "download from ntes"
cat $temp_dir/ntes_results | sed 3q | lyric-dl download - -d $temp_dir --extract
test_end

test_case "download from qq"
cat $temp_dir/qq_results | sed 3q | lyric-dl download - -d $temp_dir --extract
test_end

test_case "download qq from id"
lyric-dl download "https://y.qq.com/n/yqq/song/201932121_num.html" -d $temp_dir --extract
test_end

test_case "download from xiami"
cat $temp_dir/xiami_results | sed 3q | lyric-dl download - -d $temp_dir
test_end