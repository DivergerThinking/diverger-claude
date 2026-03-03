#!/bin/bash
# Warning: file contains lines over 300 characters — consider wrapping
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi
if grep -qEn '^.{300,}$' "$FILE_PATH" 2>/dev/null; then
  echo "Warning: file contains lines over 300 characters — consider wrapping" >&2
  exit 2
fi
exit 0
