#!/usr/bin/env sh

if [[ -z "$1" ]]; then
    echo "no search name" >&2
    exit 2
fi

echo "searching '$1'..."
urllist=`./lyric-dl search "$1" --url --g-quiet`

if [[ $? -ne 0 ]]; then
    echo "search failed" >&2
    exit 2
fi

if [[ ! -d samples/download ]]; then
    mkdir samples/download
fi

echo "$urllist" | ./lyric-dl url - -d samples/download

