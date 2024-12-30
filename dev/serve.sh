#!/usr/bin/env sh
set -e

# Check if tmux is installed
command -v tmux >/dev/null 2>&1 || { echo >&2 "I require tmux but it's not installed.  Aborting."; exit 1; }

SESSION="map_game"

SCRIPT_DIR=$(dirname $(readlink -f $0))
cd "${SCRIPT_DIR}"
echo $PWD

# Kill existing session if it exists
tmux kill-session -t $SESSION 2>/dev/null && { echo "Waiting for existing session to close"; sleep 2; }

tmux new-session -d -s $SESSION './gateway.sh'

# Let panes remain on exit
tmux set-option -t $SESSION remain-on-exit

tmux select-pane -t $SESSION -T "Gateway"

tmux split-window -t $SESSION -v './easter.sh'
tmux select-pane -t $SESSION -T "Easter"

tmux split-window -t $SESSION -v './example.sh'
tmux select-pane -t $SESSION -T "Example"

tmux split-window -t $SESSION -v './api.sh'
tmux select-pane -t $SESSION -T "API"

tmux select-layout -t $SESSION even-vertical

tmux -2 attach-session -t $SESSION 