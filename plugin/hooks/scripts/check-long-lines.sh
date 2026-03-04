#!/bin/bash
# Warning: file contains lines over 300 characters — consider wrapping
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j["tool_input"]["file_path"];console.log(v||'')}catch{console.log('')}})")
if [ -z "$FILE_PATH" ]; then exit 0; fi
if grep -qEn '^.{300,}$' "$FILE_PATH" 2>/dev/null; then
  echo "Warning: file contains lines over 300 characters — consider wrapping" >&2
  exit 2
fi
exit 0
