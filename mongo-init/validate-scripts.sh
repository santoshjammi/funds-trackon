#!/bin/bash
# MongoDB Script Syntax Validator
# Validates MongoDB shell scripts for syntax errors

set -e

echo "🔍 Validating MongoDB initialization scripts..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to validate MongoDB script syntax
validate_script() {
    local script_file="$1"
    local script_name="$(basename "$script_file")"

    if [ ! -f "$script_file" ]; then
        echo "⚠️  $script_name not found, skipping..."
        return 0
    fi

    echo "📝 Validating $script_name..."

    # Basic syntax check - look for common MongoDB shell syntax issues
    if grep -q "use [a-zA-Z_][a-zA-Z0-9_]*;" "$script_file"; then
        echo "   ✅ Database selection syntax OK"
    else
        echo "   ⚠️  No database selection found (this might be OK if inherited)"
    fi

    # Check for balanced braces
    local open_braces=$(grep -o '{' "$script_file" | wc -l)
    local close_braces=$(grep -o '}' "$script_file" | wc -l)

    if [ "$open_braces" -eq "$close_braces" ]; then
        echo "   ✅ Braces are balanced"
    else
        echo "   ❌ Braces are not balanced: $open_braces open, $close_braces close"
        return 1
    fi

    # Check for balanced parentheses
    local open_parens=$(grep -o '(' "$script_file" | wc -l)
    local close_parens=$(grep -o ')' "$script_file" | wc -l)

    if [ "$open_parens" -eq "$close_parens" ]; then
        echo "   ✅ Parentheses are balanced"
    else
        echo "   ❌ Parentheses are not balanced: $open_parens open, $close_parens close"
        return 1
    fi

    # Check for balanced brackets
    local open_brackets=$(grep -o '\[' "$script_file" | wc -l)
    local close_brackets=$(grep -o '\]' "$script_file" | wc -l)

    if [ "$open_brackets" -eq "$close_brackets" ]; then
        echo "   ✅ Brackets are balanced"
    else
        echo "   ❌ Brackets are not balanced: $open_brackets open, $close_brackets close"
        return 1
    fi

    # Check for common syntax errors
    if grep -q "db\.[a-zA-Z_][a-zA-Z0-9_]*\." "$script_file"; then
        echo "   ✅ Database operations syntax OK"
    fi

    # Check for proper JSON schema structure
    if grep -q '"\$jsonSchema"' "$script_file"; then
        echo "   ✅ JSON Schema validation found"
    fi

    echo "   ✅ $script_name validation passed"
    return 0
}

# Validate all scripts
scripts=(
    "01-init-database.js"
    "02-setup-schema.js"
    "03-create-indexes.js"
    "04-seed-data.js"
)

all_passed=true

for script in "${scripts[@]}"; do
    script_path="$SCRIPT_DIR/$script"
    if ! validate_script "$script_path"; then
        all_passed=false
    fi
done

echo ""
if [ "$all_passed" = true ]; then
    echo "🎉 All MongoDB scripts passed validation!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy scripts to mongo-init/ directory in Docker context"
    echo "   2. Update docker-compose.yml to mount the scripts"
    echo "   3. Run 'docker-compose up mongodb' to initialize"
    echo "   4. Verify collections and indexes are created correctly"
else
    echo "❌ Some scripts failed validation. Please fix the errors above."
    exit 1
fi