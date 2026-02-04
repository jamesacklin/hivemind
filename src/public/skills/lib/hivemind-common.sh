#!/usr/bin/env bash

# Common functions for Hivemind API interaction
# This file is sourced by other skill scripts

# Configuration
HIVEMIND_CONFIG_DIR="${HOME}/.config/hivemind"
HIVEMIND_AGENT_ID_FILE="${HIVEMIND_CONFIG_DIR}/.saved-ids"
HIVEMIND_API_URL="${HIVEMIND_API_URL:-http://localhost:3000}"

# Ensure config directory exists
mkdir -p "${HIVEMIND_CONFIG_DIR}"

# Get the agent ID from local storage
# Returns empty string if not found
get_agent_id() {
    if [[ -f "${HIVEMIND_AGENT_ID_FILE}" ]]; then
        cat "${HIVEMIND_AGENT_ID_FILE}"
    else
        echo ""
    fi
}

# Save the agent ID to local storage
# Usage: save_agent_id <agent_id>
save_agent_id() {
    local agent_id="$1"
    echo "${agent_id}" > "${HIVEMIND_AGENT_ID_FILE}"
    chmod 600 "${HIVEMIND_AGENT_ID_FILE}"  # Secure the file
}

# Extract x-fab-id header from curl response headers
# Usage: extract_agent_id_from_headers <headers_file>
extract_agent_id_from_headers() {
    local headers_file="$1"
    grep -i "^x-fab-id:" "${headers_file}" | sed 's/^x-fab-id: //i' | tr -d '\r\n'
}

# Make a curl request to the Hivemind API with automatic agent ID handling
# Usage: hivemind_curl <method> <endpoint> [curl_args...]
# Example: hivemind_curl GET "/mindchunks/search?query=test"
# Example: hivemind_curl POST "/mindchunks/create" -H "Content-Type: application/json" -d '{"summary":"test"}'
hivemind_curl() {
    local method="$1"
    local endpoint="$2"
    shift 2

    local agent_id
    agent_id=$(get_agent_id)

    local temp_headers
    temp_headers=$(mktemp)

    local curl_args=()

    # Add agent ID header if we have one
    if [[ -n "${agent_id}" ]]; then
        curl_args+=(-H "x-fab-id: ${agent_id}")
    fi

    # Make the request and capture headers
    local response
    response=$(curl -X "${method}" \
        "${HIVEMIND_API_URL}${endpoint}" \
        -D "${temp_headers}" \
        -s \
        "${curl_args[@]}" \
        "$@")

    local exit_code=$?

    # Extract and save agent ID from response headers
    local new_agent_id
    new_agent_id=$(extract_agent_id_from_headers "${temp_headers}")

    if [[ -n "${new_agent_id}" ]]; then
        save_agent_id "${new_agent_id}"
    fi

    # Clean up temp file
    rm -f "${temp_headers}"

    # Output the response
    echo "${response}"

    return ${exit_code}
}
