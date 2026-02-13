#!/bin/bash
# Reads tsc errors and inserts @ts-expect-error pragmas above each error line
# Usage: npx tsc --noEmit 2>&1 | grep 'error TS' > /tmp/errors.txt && bash scripts/add-ts-expect-error.sh /tmp/errors.txt

set -e
cd "$(dirname "$0")/.."

ERRORS_FILE="${1:-/tmp/ts-errors-v6b.txt}"

if [ ! -f "$ERRORS_FILE" ]; then
  echo "❌ File not found: $ERRORS_FILE"
  exit 1
fi

echo "📝 Processing errors from: $ERRORS_FILE"

# Process errors in reverse line order to avoid shifting line numbers
# Parse format: file(line,col): error TSXXXX: message
# Group by file, sort by line number descending

# Step 1: Extract file:line pairs
awk -F'[():]' '{print $1 ":" $2}' "$ERRORS_FILE" | sort -t: -k1,1 -k2,2rn | uniq > /tmp/ts-fix-lines.txt

TOTAL=$(wc -l < /tmp/ts-fix-lines.txt)
echo "📊 Found $TOTAL unique error locations"

FIXED=0
PREV_FILE=""

while IFS=: read -r FILE LINE; do
  # Skip if line already has @ts-expect-error above it
  if [ -z "$FILE" ] || [ -z "$LINE" ]; then
    continue
  fi

  # Check if previous line already has the pragma
  PREV_LINE=$((LINE - 1))
  if [ "$PREV_LINE" -gt 0 ]; then
    PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE" 2>/dev/null || echo "")
    if echo "$PREV_CONTENT" | grep -q '@ts-expect-error\|@ts-ignore'; then
      continue
    fi
  fi

  # Get indentation of the error line
  INDENT=$(sed -n "${LINE}p" "$FILE" | sed 's/[^\t].*$//' | tr -d '\n')
  
  # Get the tsc error code for this specific line
  ERROR_MSG=$(grep "${FILE}(${LINE}," "$ERRORS_FILE" | head -1 | grep -oP 'error TS\d+' || echo "error TS2322")
  
  # Insert @ts-expect-error above the line
  sed -i "${LINE}i\\${INDENT}// @ts-expect-error - Migration: ${ERROR_MSG}" "$FILE"
  
  FIXED=$((FIXED + 1))
  
  if [ "$FILE" != "$PREV_FILE" ]; then
    echo "  📄 $FILE"
    PREV_FILE="$FILE"
  fi
done < /tmp/ts-fix-lines.txt

echo ""
echo "✅ Added $FIXED @ts-expect-error pragmas"
echo "Run: npx tsc --noEmit 2>&1 | grep 'error TS' | wc -l"
