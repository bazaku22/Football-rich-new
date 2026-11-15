#!/usr/bin/env bash
set -euo pipefail
base64 -d ../scripts/apply-v1-5-ui.mjs.gz.b64 | gzip -dc > /tmp/apply-v1-5-ui.mjs
node /tmp/apply-v1-5-ui.mjs
