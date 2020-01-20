#!/bin/bash
set -euo pipefail

# Input
INPUT_FILE='lib/private/manifest-file-schema.ts'

# Output
OUTPUT_DIR='schema'
OUTPUT_FILE="${OUTPUT_DIR}/manifest.schema.json"

mkdir -p ${OUTPUT_DIR}

echo "Generating JSON schema into ${OUTPUT_FILE}"
typescript-json-schema                   \
    ${INPUT_FILE}      'schema.ManifestFile'    \
    --out              ${OUTPUT_FILE}    \
    --refs             true              \
    --required         true              \
    --strictNullChecks true              \
    --aliasRefs        true              \
    --topRef           true
