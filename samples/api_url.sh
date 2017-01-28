#!/usr/bin/env sh

if [[ -z "$1" ]]; then
    echo "need url argument" >&2
    exit 2
fi

curl --data-urlencode "target=$1" "http://localhost:8080/api/url" 

