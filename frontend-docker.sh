#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

MODE="${1:-}"
ACTION="${2:-}"

case "$MODE" in
    dev)
        COMPOSE_FILE="$ROOT_DIR/docker/compose.dev.yml"
        SERVICE="frontend"
        PROFILE_ARGS=()
        ;;

    prod)
        COMPOSE_FILE="$ROOT_DIR/docker/compose.yml"
        SERVICE="frontend"
        PROFILE_ARGS=(--profile prod)
        ;;

    *)
        echo "Usage: $0 {dev|prod} {up|build|down|restart|logs|ps|shell}"
        exit 1
        ;;
esac

COMPOSE=(
    docker compose
    -p core-platform-frontend
    -f "$COMPOSE_FILE"
    "${PROFILE_ARGS[@]}"
)

case "$ACTION" in
    up)
        "${COMPOSE[@]}" up -d
        ;;

    build)
        "${COMPOSE[@]}" up -d --build
        ;;

    down)
        "${COMPOSE[@]}" down
        ;;

    restart)
        "${COMPOSE[@]}" restart
        ;;

    logs)
        "${COMPOSE[@]}" logs -f
        ;;

    ps)
        "${COMPOSE[@]}" ps
        ;;

    shell)
        "${COMPOSE[@]}" exec "$SERVICE" sh
        ;;

    *)
        echo "Usage: $0 {dev|prod} {up|build|down|restart|logs|ps|shell}"
        exit 1
        ;;
esac
