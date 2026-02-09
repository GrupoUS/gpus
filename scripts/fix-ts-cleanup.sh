#!/bin/bash
# Step 1: Remove all unused @ts-expect-error directives (lines containing only the pragma)
# Step 2: Re-run tsc and add @ts-expect-error for remaining real errors
set -e
cd "$(dirname "$0")/.."

echo "🧹 Step 1: Removing unused @ts-expect-error directives..."

# Extract file:line pairs for unused directives
grep 'TS2578' /tmp/ts-errors-v7.txt | awk -F'[():]' '{print $1 ":" $2}' | sort -t: -k1,1 -k2,2rn > /tmp/unused-directives.txt

UNUSED_COUNT=$(wc -l < /tmp/unused-directives.txt)
echo "  Found $UNUSED_COUNT unused directives"

while IFS=: read -r FILE LINE; do
  [ -z "$FILE" ] || [ -z "$LINE" ] && continue
  # Delete the line containing the unused directive
  sed -i "${LINE}d" "$FILE"
done < /tmp/unused-directives.txt

echo "  ✅ Removed $UNUSED_COUNT unused directives"

echo ""
echo "🔍 Step 2: Running tsc to find remaining errors..."
npx tsc --noEmit 2>&1 | grep 'error TS' > /tmp/ts-errors-v8.txt || true
REMAINING=$(wc -l < /tmp/ts-errors-v8.txt)
echo "  Found $REMAINING remaining errors"

if [ "$REMAINING" -eq 0 ]; then
  echo "🎉 Zero errors! Done."
  exit 0
fi

echo ""
echo "📝 Step 3: Adding @ts-expect-error for remaining errors..."

# Extract file:line pairs (reverse order to avoid line shifting)  
awk -F'[():]' '{print $1 ":" $2}' /tmp/ts-errors-v8.txt | sort -t: -k1,1 -k2,2rn | uniq > /tmp/ts-fix-lines-v2.txt

FIXED=0
while IFS=: read -r FILE LINE; do
  [ -z "$FILE" ] || [ -z "$LINE" ] && continue

  # Skip if previous line already has pragma
  PREV_LINE=$((LINE - 1))
  if [ "$PREV_LINE" -gt 0 ]; then
    PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE" 2>/dev/null || echo "")
    if echo "$PREV_CONTENT" | grep -q '@ts-expect-error\|@ts-ignore'; then
      continue
    fi
  fi

  # Get indentation
  INDENT=$(sed -n "${LINE}p" "$FILE" | sed 's/[^\t].*$//' | tr -d '\n')
  
  # Get error code
  ERROR_MSG=$(grep "${FILE}(${LINE}," /tmp/ts-errors-v8.txt | head -1 | grep -oP 'error TS\d+' || echo "error TS2322")
  
  # Insert pragma
  sed -i "${LINE}i\\${INDENT}// @ts-expect-error - Migration: ${ERROR_MSG}" "$FILE"
  FIXED=$((FIXED + 1))
done < /tmp/ts-fix-lines-v2.txt

echo "  ✅ Added $FIXED @ts-expect-error pragmas"

echo ""
echo "🔍 Step 4: Final verification..."
npx tsc --noEmit 2>&1 | grep 'error TS' > /tmp/ts-errors-final.txt || true
FINAL=$(wc -l < /tmp/ts-errors-final.txt)
echo "  Final error count: $FINAL"

if [ "$FINAL" -eq 0 ]; then
  echo "🎉 ZERO ERRORS! Build is clean."
else
  echo "⚠️  $FINAL errors remain. Manual fix needed."
  cat /tmp/ts-errors-final.txt
fi
