#!/bin/bash

export PASS_RAW="Aresluci01!!"
export PASS_ENC="Aresluci01%21%21"

echo "--- TEST 1: RAW ---"
npm config set proxy "http://thiago.tco:${PASS_RAW}@proxy.pmfi.pr.gov.br:8080"
echo "Set: ...${PASS_RAW}..."
echo "Got: $(npm config get proxy)"

echo "--- TEST 2: ENCODED ---"
npm config set proxy "http://thiago.tco:${PASS_ENC}@proxy.pmfi.pr.gov.br:8080"
echo "Set: ...${PASS_ENC}..."
echo "Got: $(npm config get proxy)"
