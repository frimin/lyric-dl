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

test_start "search"
lyric-dl search $search_name --url --g-quiet > samples/download/search_result
test_end

test_start "download search results"
cat samples/download/search_result | lyric-dl url - -d samples/download
test_end

