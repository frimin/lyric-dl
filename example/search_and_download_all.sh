#!/usr/bin/env sh

if [[ -z "$1" ]]; then
    echo "no search name" >&2
    exit 2
fi

if [[ ! -d samples/download ]]; then
    mkdir samples/download
fi

echo "searching '$1'..."

lyric-dl search "$1" -o samples/download/search_result --output-url

if [[ $? -ne 0 ]]; then
    echo "search failed" >&2
    exit 2
fi

cat samples/download/search_result | lyric-dl dl - -d samples/download

