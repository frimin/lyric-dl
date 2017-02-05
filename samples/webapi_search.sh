#!/usr/bin/env sh

if [[ -z "$1" ]]; then
    echo "need search name" >&2
    exit 2
fi

if [[ -z "$2" ]]; then
    from="ntes"
else
    from=$2
fi

curl --data-urlencode "target=$1" --data-urlencode "from=$from" "http://localhost:8080/api/search" 

