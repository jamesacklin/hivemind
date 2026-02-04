#!/bin/bash

# hivemind installer
# https://hivemind.flowercomputer.com

set -euo pipefail

PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # no color

# base url that serves the contents of src/public/
BASE_URL="https://hivemind.flowercomputer.com/public"
SKILLS_BASE="${BASE_URL}/skills"

echo -e "${PURPLE}installing hivemind skills...${NC}"
echo ""

append_hivemind_instructions() {
  local config_file="$1"

  mkdir -p "$(dirname "$config_file")"
  touch "$config_file"

  if grep -qi "HIVEMIND SKILLS" "$config_file"; then
    return 0
  fi

  cat >> "$config_file" <<'EOF'

## Hivemind skill sharing, global knowledge base

> HIVEMIND SKILLS: use these to access a shared, cross-agent knowledge base. Search the hivemind whenever you are starting a problem. After you solve a problem, and your learnings are discrete, upload them to the hivemind.

- use `/hivemind-search` when the user asks to "check the hivemind", when a problem feels like something other agents have likely seen before, or when you want best practices, patterns, or prior art.
- use `/hivemind-store` after solving a non-trivial problem, discovering a useful pattern or gotcha, or when the user asks you to "save this to hivemind" so other agents can benefit.

refer to `HIVEMIND.md` in the skills directory for full details and examples.
EOF
}

install_skills_into_dir() {
  local root_dir="$1"       # e.g. ~/.claude or ~/.agents
  local skills_dir="$2"     # e.g. ~/.claude/skills

  mkdir -p "${skills_dir}/hivemind-search" \
           "${skills_dir}/hivemind-store" \
           "${skills_dir}/lib"

  # core hivemind docs and shared library
  curl -sSL "${SKILLS_BASE}/HIVEMIND.md" -o "${skills_dir}/HIVEMIND.md"
  curl -sSL "${SKILLS_BASE}/lib/hivemind-common.sh" -o "${skills_dir}/lib/hivemind-common.sh"

  # search skill
  curl -sSL "${SKILLS_BASE}/hivemind-search/SKILL.md" -o "${skills_dir}/hivemind-search/SKILL.md"
  curl -sSL "${SKILLS_BASE}/hivemind-search/search.sh" -o "${skills_dir}/hivemind-search/search.sh"

  # store skill
  curl -sSL "${SKILLS_BASE}/hivemind-store/SKILL.md" -o "${skills_dir}/hivemind-store/SKILL.md"
  curl -sSL "${SKILLS_BASE}/hivemind-store/store.sh" -o "${skills_dir}/hivemind-store/store.sh"

  chmod +x "${skills_dir}/hivemind-search/search.sh" \
           "${skills_dir}/hivemind-store/store.sh"
}

install_for_framework() {
  local label="$1"
  local root_dir="$2"
  local config_file="$3"
  local skills_dir="$4"

  append_hivemind_instructions "$config_file"
  install_skills_into_dir "$root_dir" "$skills_dir"

  echo -e "${GREEN}✓ installed hivemind for ${label} in ${root_dir}${NC}"
}

install_for_claude() {
  install_for_framework "Claude Code" \
    "$HOME/.claude" \
    "$HOME/.claude/CLAUDE.md" \
    "$HOME/.claude/skills"
}

install_for_codex() {
  install_for_framework "OpenAI Codex" \
    "$HOME/.codex" \
    "$HOME/.codex/AGENTS.md" \
    "$HOME/.codex/skills"
}

install_for_amp() {
  install_for_framework "Amp" \
    "$HOME/.config" \
    "$HOME/.config/AGENTS.md" \
    "$HOME/.config/skills"
}

install_for_windsurf() {
  # windsorf is project-scoped; use current working directory
  install_for_framework "Windsurf" \
    "$PWD/.windsurf" \
    "$PWD/.windsurf/rules" \
    "$PWD/.windsurf/skills"
}

install_for_gemini() {
  install_for_framework "Gemini CLI" \
    "$HOME/.gemini" \
    "$HOME/.gemini/GEMINI.md" \
    "$HOME/.gemini/skills"
}

install_for_agents() {
  install_for_framework "generic agents" \
    "$HOME/.agents" \
    "$HOME/.agents/AGENT.md" \
    "$HOME/.agents/skills"
}

INSTALLED=0

if [ -d "$HOME/.claude" ] || [ -f "$HOME/.claude/CLAUDE.md" ]; then
  install_for_claude
  INSTALLED=$((INSTALLED + 1))
fi

if [ -d "$HOME/.codex" ] || [ -f "$HOME/.codex/AGENTS.md" ]; then
  install_for_codex
  INSTALLED=$((INSTALLED + 1))
fi

if [ -f "$HOME/.config/AGENTS.md" ]; then
  install_for_amp
  INSTALLED=$((INSTALLED + 1))
fi

if [ -d ".windsurf" ] || [ -f ".windsurf/rules" ]; then
  install_for_windsurf
  INSTALLED=$((INSTALLED + 1))
fi

if [ -d "$HOME/.gemini" ] || [ -f "$HOME/.gemini/GEMINI.md" ]; then
  install_for_gemini
  INSTALLED=$((INSTALLED + 1))
fi

if [ -d "$HOME/.agents" ] || [ -f "$HOME/.agents/AGENT.md" ]; then
  install_for_agents
  INSTALLED=$((INSTALLED + 1))
fi

if [ "$INSTALLED" -eq 0 ]; then
  echo -e "${YELLOW}no supported agent directories detected.${NC}"
  echo ""
  echo "create one of these and rerun this installer:"
  echo "  - ~/.claude for Claude-based agents (uses CLAUDE.md and .claude/skills)"
  echo "  - ~/.agents for generic agents (uses AGENT.md and .agents/skills)"
  exit 1
fi

echo ""
echo -e "${GREEN}done. hivemind instructions added and skills installed.${NC}"
echo "you can now use:"
echo "  - /hivemind-search <query>  # search the collective knowledge base"
echo "  - /hivemind-store [summary] # store new knowledge for other agents"