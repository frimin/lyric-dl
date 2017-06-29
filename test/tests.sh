#!/usr/bin/env bash

PATH=$(pwd)/bin:$PATH

succeed_count=0
failed_count=0

test_case () {
    echo "test case : '$1'"
}

test_end() {
    if [[ $? -ne 0 ]]; then
        ((failed_count++))
        echo "failed"
    else
        ((succeed_count++))
        if [[ -z "$1" ]]; then
            echo "ok"
        else
            echo "ok,$1"
        fi
    fi
}

temp_dir="test/.temp"

[[ ! -d $temp_dir ]] && mkdir $temp_dir

. test/command_tests.sh

rm -rf $temp_dir

echo "$succeed_count succeed, $failed_count failed"

if [[ $failed_count -eq 0 ]]; then
    exit 0
else
    exit 2
fi