#!/usr/bin/env sh

PATH=$PATH:$(pwd)

search_name="123"

if [[ ! -d samples/download ]]; then
    mkdir samples/download
fi

function test_start() {
    echo "test : '$1'"
}

function test_end() {
    if [[ $? -ne 0 ]]; then
        echo "failed"
        exit 2
    else
        if [[ -z "$1" ]]; then
            echo "ok"
        else
            echo "ok,$1"
        fi
    fi
}

test_start "search from ntes"
lyric-dl search $search_name -f ntes --url --output samples/download/search_result_ntes
test_end

test_start "download search results"
cat samples/download/search_result_ntes | sed 3q | lyric-dl download - -d samples/download
test_end

test_start "search from qq"
lyric-dl search $search_name -f qq --url --output samples/download/search_result_qq
test_end

test_start "download search results"
cat samples/download/search_result_qq | sed 3q | lyric-dl download - -d samples/download
test_end

