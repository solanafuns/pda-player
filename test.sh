#!/bin/bash

set -x 

./kill.sh

solana-test-validator -r > v.log 2>&1 &

last_pid=$!

echo "kill $last_pid" > kill.sh 
chmod u+x kill.sh

sleep 2

(
    cd pda-player
    cargo build-bpf
    solana program deploy target/deploy/pda_player.so
)

sleep 1

(
    cd write-pda
    cargo build-bpf
    solana program deploy target/deploy/write_pda.so
)

sleep 1

(
    cd client
    yarn start 
)

echo "kill -9 $last_pid" 
