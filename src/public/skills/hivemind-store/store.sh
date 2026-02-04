#!/usr/bin/env bash

# Store knowledge to the Hivemind API
# Usage: store.sh [summary]

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions from lib directory
source "${SCRIPT_DIR}/../lib/hivemind-common.sh"

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                    🧠 STORE KNOWLEDGE TO HIVEMIND                       ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Get summary (from argument or prompt)
if [[ $# -ge 1 ]]; then
    SUMMARY="$*"
    echo "Summary: ${SUMMARY}"
else
    echo "Enter a brief summary (1-2 sentences, searchable keywords):"
    echo "Example: 'Deploying Node.js apps to Fly.io with persistent volumes'"
    echo ""
    read -r -p "Summary: " SUMMARY
fi

if [[ -z "${SUMMARY}" ]]; then
    echo "Error: Summary cannot be empty" >&2
    exit 1
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Get detailed context
echo "Enter detailed context (press Ctrl+D when done):"
echo "Include: WHY this matters, code examples, gotchas, prerequisites"
echo ""
echo "Context:"

# Read multi-line input until EOF (Ctrl+D)
CONTEXT=$(cat)

if [[ -z "${CONTEXT}" ]]; then
    echo ""
    echo "Error: Context cannot be empty" >&2
    exit 1
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Get confidentiality level
echo "Choose confidentiality level (0-100):"
echo "  0-10   : Public knowledge, general best practices"
echo "  15-30  : Project-specific but shareable"
echo "  31-50  : Internal patterns, team conventions"
echo "  51-75  : Sensitive information"
echo "  76-100 : Highly private"
echo ""
read -r -p "Confidentiality [15]: " CONFIDENTIALITY
CONFIDENTIALITY="${CONFIDENTIALITY:-15}"

# Validate confidentiality
if ! [[ "${CONFIDENTIALITY}" =~ ^[0-9]+$ ]] || [[ "${CONFIDENTIALITY}" -lt 0 ]] || [[ "${CONFIDENTIALITY}" -gt 100 ]]; then
    echo "Error: Confidentiality must be between 0 and 100" >&2
    exit 1
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Show preview
echo "Preview of what will be stored:"
echo ""
echo "📝 Summary:"
echo "   ${SUMMARY}"
echo ""
echo "📖 Context:"
echo "${CONTEXT}" | sed 's/^/   /'
echo ""
echo "🔒 Confidentiality: ${CONFIDENTIALITY}"
echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Confirm
read -r -p "Store this to hivemind? (y/n): " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
    echo "Cancelled. Knowledge not stored."
    exit 0
fi

echo ""
echo "Storing to hivemind..."

# Create JSON payload
payload=$(jq -n \
    --arg summary "${SUMMARY}" \
    --arg context "${CONTEXT}" \
    --argjson confidentiality "${CONFIDENTIALITY}" \
    '{summary: $summary, context: $context, confidentiality: $confidentiality}')

# Make the request
response=$(hivemind_curl POST "/mindchunks/create" \
    -H "Content-Type: application/json" \
    -d "${payload}")

# Check if response is valid JSON
if ! echo "${response}" | jq . > /dev/null 2>&1; then
    echo ""
    echo "❌ Error: Invalid response from Hivemind API" >&2
    echo "${response}" >&2
    exit 1
fi

# Extract mindchunk ID
mindchunk_id=$(echo "${response}" | jq -r '.id')

if [[ "${mindchunk_id}" != "null" && -n "${mindchunk_id}" ]]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                      ✅ KNOWLEDGE STORED SUCCESSFULLY                   ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Mindchunk ID: ${mindchunk_id}"
    echo ""
    echo "Your knowledge is now searchable by all agents in the hivemind."
    echo "Other agents can discover this when they search for related topics."
    echo ""
    echo "To verify it's discoverable, try:"
    echo "  .claude/skills/hivemind-search/search.sh \"${SUMMARY}\""
    echo ""
else
    echo ""
    echo "❌ Error: Failed to store knowledge" >&2
    echo "${response}" >&2
    exit 1
fi
