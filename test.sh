#!/bin/sh

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"r4rk1/p2qn1pp/2pbbp2/3pp3/4P3/Q1Nn1N2/P1PBBPPP/R4RK1 w - - 0 14\"}" \
  "http://localhost:8080"

echo

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b - - 0 14\"}" \
  "http://localhost:8080"

echo

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"rnb1kb1r/pppp2Pp/4p2n/6q1/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 5\"}" \
  "http://localhost:8080"

echo

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"8/8/8/p7/P6p/K1n4P/1pk5/8 b - - 0 1\"}" \
  "http://localhost:8080"

echo

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"8/5P1k/5K2/8/8/8/8/8 w - - 0 1\"}" \
  "http://localhost:8080"

echo

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"fen\": \"8/6P1/8/7p/7p/p6k/P6p/7K w - - 0 1\"}" \
  "http://localhost:8080"
