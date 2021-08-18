#!/bin/bash

if !(type "jq" > /dev/null 2>&1); then
    echo "No jq command! need install."
    exit 1
fi

REPORT_DIR=$1
OUTPUT="$REPORT_DIR$(date '+%s').csv"

echo '"url", "first-contentful-paint", "fcp unit", "time-to-interactive", "tti unit"' >> $OUTPUT

for file in $( ls ${REPORT_DIR} ); do
    cat ${REPORT_DIR}$file | jq -r '[
        .requestedUrl,
        .audits."first-contentful-paint".numericValue,
        .audits."first-contentful-paint".numericUnit,
        .audits."interactive".numericValue,
        .audits."interactive".numericUnit
    ] | @csv' >> $OUTPUT
done