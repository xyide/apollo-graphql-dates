#!/bin/sh
cd /app

npm install --no-audit --no-fund
# || exit 1

npm start
