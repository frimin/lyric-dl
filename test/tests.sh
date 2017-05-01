#!/usr/bin/env sh

PATH=$(pwd)/bin:$PATH

function test_start() {
    echo "test case : '$1'"
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

temp_dir="test/.temp"

if [[ ! -d $temp_dir ]]; then
    mkdir $temp_dir
fi

case $1 in
    command) . test/command_tests.sh;;
    module) . test/module_tests.sh;;
    *) . test/module_tests.sh && . test/command_tests.sh ;;
esac

exit_code=$?

rm -rf $temp_dir

exit $exit_code