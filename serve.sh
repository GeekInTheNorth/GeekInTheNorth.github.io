#!/usr/bin/env bash
# Local preview for stott.pro. The toolchain lives outside the repo in
# ~/.stott-build (Ruby 3.3 and the github-pages gems), so nothing lands in git.
#
#   ./serve.sh          build, then serve at http://localhost:4000
#   ./serve.sh build    build only (shows errors and warnings)
#   ./serve.sh check    build, then check links with html-proofer
set -euo pipefail

ENV_FILE="$HOME/.stott-build/env.sh"
SITE_DIR="$HOME/.stott-build/site"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE: the local build toolchain isn't set up on this machine." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

# Run from the repo root, wherever the script is called from.
cd "$(dirname "$0")"

mode="${1:-serve}"

case "$mode" in
  serve)
    bundle exec jekyll build -d "$SITE_DIR"
    # No --livereload: the site's Content Security Policy blocks the live-reload script.
    bundle exec jekyll serve -d "$SITE_DIR"
    ;;
  build)
    bundle exec jekyll build -d "$SITE_DIR"
    ;;
  check)
    bundle exec jekyll build -d "$SITE_DIR"
    bundle exec htmlproofer "$SITE_DIR" --disable-external
    ;;
  *)
    echo "Usage: $0 [serve|build|check]" >&2
    exit 1
    ;;
esac
