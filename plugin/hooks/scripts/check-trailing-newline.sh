#!/bin/bash
# Check that file ends with a newline
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi
if [ -s "$FILE_PATH" ]; then
  LAST_CHAR=$(tail -c 1 "$FILE_PATH" 2>/dev/null | od -An -tx1 | tr -d ' ')
  if [ "$LAST_CHAR" != "0a" ] && [ "$LAST_CHAR" != "" ]; then
    echo "Warning: file does not end with a newline" >&2
    exit 2
  fi
fi
exit 0
