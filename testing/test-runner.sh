#!/bin/bash

# Test Runner Script for Troop Manager
# This script runs the test suite with proper error handling and reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_COVERAGE=70
TEST_TIMEOUT=300  # 5 minutes

echo -e "${BLUE}🧪 Starting Test Suite for Troop Manager${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
print_status $BLUE "📋 Checking prerequisites..."

if ! command_exists npm; then
    print_status $RED "❌ npm is not installed"
    exit 1
fi

if ! command_exists node; then
    print_status $RED "❌ Node.js is not installed"
    exit 1
fi

print_status $GREEN "✅ Prerequisites met"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "📦 Installing dependencies..."
    npm ci || {
        print_status $RED "❌ Failed to install dependencies"
        exit 1
    }
fi

# Run linting first
print_status $BLUE "🔍 Running ESLint..."
npm run build > /dev/null 2>&1 || {
    print_status $RED "❌ Build failed - fix linting errors first"
    exit 1
}
print_status $GREEN "✅ Linting passed"

# Run different test categories
run_test_category() {
    local category=$1
    local description=$2
    
    print_status $BLUE "🧪 Running $description..."
    
    if npm run test:$category; then
        print_status $GREEN "✅ $description passed"
        return 0
    else
        print_status $RED "❌ $description failed"
        return 1
    fi
}

# Track test results
FAILED_TESTS=()

# Run component tests
if ! run_test_category "components" "Component Tests"; then
    FAILED_TESTS+=("components")
fi

# Run service tests
if ! run_test_category "services" "Service Tests"; then
    FAILED_TESTS+=("services")
fi

# Run user management tests
if ! run_test_category "users" "User Management Tests"; then
    FAILED_TESTS+=("users")
fi

# Run security tests
if ! run_test_category "security" "Security Tests"; then
    FAILED_TESTS+=("security")
fi

# Run integration tests
if ! run_test_category "integration" "Integration Tests"; then
    FAILED_TESTS+=("integration")
fi

# Run full test suite with coverage
print_status $BLUE "📊 Running full test suite with coverage..."

# Create coverage directory
mkdir -p coverage

# Run tests with coverage
if npm run test:coverage; then
    print_status $GREEN "✅ Coverage tests completed"
    
    # Check coverage thresholds
    if [ -f "coverage/coverage-summary.json" ]; then
        # Parse coverage data (simplified check)
        COVERAGE_LINE=$(grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*}' coverage/coverage-summary.json | grep -o '"pct":[0-9.]*' | cut -d: -f2)
        
        if [ -n "$COVERAGE_LINE" ]; then
            COVERAGE_INT=${COVERAGE_LINE%.*}  # Remove decimal part for comparison
            
            if [ "$COVERAGE_INT" -ge "$MIN_COVERAGE" ]; then
                print_status $GREEN "✅ Coverage threshold met: ${COVERAGE_LINE}%"
            else
                print_status $YELLOW "⚠️  Coverage below threshold: ${COVERAGE_LINE}% (minimum: ${MIN_COVERAGE}%)"
                FAILED_TESTS+=("coverage")
            fi
        fi
    fi
else
    print_status $RED "❌ Coverage tests failed or timed out"
    FAILED_TESTS+=("coverage")
fi

# Generate test summary
echo ""
echo "=================================================="
print_status $BLUE "📋 Test Summary"
echo "=================================================="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    print_status $GREEN "🎉 All tests passed successfully!"
    
    # Generate test report summary
    echo ""
    echo "📊 Test Report Summary:"
    echo "  • Component Tests: ✅ Passed"
    echo "  • Service Tests: ✅ Passed"  
    echo "  • Integration Tests: ✅ Passed"
    echo "  • Coverage Tests: ✅ Passed"
    
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo ""
        echo "📈 Coverage Report: file://$(pwd)/coverage/lcov-report/index.html"
    fi
    
    exit 0
else
    print_status $RED "❌ Some tests failed:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  • $test"
    done
    
    echo ""
    print_status $YELLOW "🔧 Next steps:"
    echo "  1. Review failed test output above"
    echo "  2. Fix failing tests"
    echo "  3. Run specific test category: npm run test:<category>"
    echo "  4. Re-run full suite: npm run test:coverage"
    
    exit 1
fi
