#/usr/bin/env bash

if [[ -z "$1" ]]; then
    echo "no search name" >&2
    exit 2
fi

url=`./lyric-dl search "$1" --url --g-quiet | sed -n 1p`

if [[ $? -ne 0 ]]; then
    echo "search failed" >&2
    exit 2
fi

./lyric-dl url "$url" -o $1
