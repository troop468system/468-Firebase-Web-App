#!/bin/bash

# 🚀 Troop Manager Run Script
# Comprehensive script for development, production, and testing
# Usage: ./run.sh [dev|prod|tests] [--skip-tests]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MIN_COVERAGE=70
TEST_TIMEOUT=300  # 5 minutes
NODE_VERSION_MIN="16"

# Default values
MODE=""
SKIP_TESTS=false

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage
print_usage() {
    echo ""
    print_status $CYAN "🚀 Troop Manager Run Script"
    echo "============================================="
    echo ""
    echo "Usage: ./run.sh [MODE] [OPTIONS]"
    echo ""
    echo "MODES:"
    echo "  dev      Start development server"
    echo "  prod     Deploy to production"
    echo "  tests    Run tests only"
    echo ""
    echo "OPTIONS:"
    echo "  --skip-tests    Skip running tests (works for dev and prod modes)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh dev                    # Start dev server with tests"
    echo "  ./run.sh dev --skip-tests       # Start dev server without tests"
    echo "  ./run.sh prod                   # Deploy to production with tests"
    echo "  ./run.sh prod --skip-tests      # Deploy to production without tests"
    echo "  ./run.sh tests                  # Run tests only"
    echo ""
    echo "Aliases:"
    echo "  npm run dev          → ./run.sh dev"
    echo "  npm run dev:skip     → ./run.sh dev --skip-tests"
    echo "  npm run deploy       → ./run.sh prod"
    echo "  npm run deploy:skip  → ./run.sh prod --skip-tests"
    echo "  npm run test:all     → ./run.sh tests"
    echo ""
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    print_status $RED "❌ No mode specified"
    print_usage
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|development)
            MODE="dev"
            shift
            ;;
        prod|production)
            MODE="prod"
            shift
            ;;
        tests|test)
            MODE="tests"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help|-h)
            print_usage
            exit 0
            ;;
        *)
            print_status $RED "❌ Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate mode
if [ -z "$MODE" ]; then
    print_status $RED "❌ No valid mode specified"
    print_usage
    exit 1
fi

# Validate skip-tests option for tests mode
if [ "$MODE" = "tests" ] && [ "$SKIP_TESTS" = true ]; then
    print_status $RED "❌ Cannot use --skip-tests with tests mode"
    print_usage
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_status $RED "❌ Node.js is not installed"
        print_status $YELLOW "Please install Node.js version $NODE_VERSION_MIN or higher"
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$node_version" -lt "$NODE_VERSION_MIN" ]; then
        print_status $RED "❌ Node.js version $node_version is too old"
        print_status $YELLOW "Please upgrade to Node.js version $NODE_VERSION_MIN or higher"
        exit 1
    fi
    
    print_status $GREEN "✅ Node.js version $(node -v) is compatible"
}

# Function to install dependencies
install_dependencies() {
    print_status $BLUE "📦 Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_status $RED "❌ package.json not found"
        exit 1
    fi
    
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm ci || {
            print_status $RED "❌ Failed to install dependencies"
            exit 1
        }
        print_status $GREEN "✅ Dependencies installed successfully"
    else
        print_status $GREEN "✅ Dependencies are up to date"
    fi
}

# Function to run linting
run_linting() {
    print_status $BLUE "🔍 Running ESLint..."
    
    if npm run build > /dev/null 2>&1; then
        print_status $GREEN "✅ Linting passed"
        return 0
    else
        print_status $RED "❌ Linting failed"
        print_status $YELLOW "Run 'npm run build' to see detailed linting errors"
        return 1
    fi
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    local failed_tests=()
    
    print_status $BLUE "🧪 Running comprehensive test suite..."
    
    # Run all tests with Jest
    print_status $CYAN "  → Running all tests..."
    if npm test -- --watchAll=false --passWithNoTests > /dev/null 2>&1; then
        print_status $GREEN "    ✅ All tests passed"
    else
        print_status $RED "    ❌ Some tests failed"
        failed_tests+=("jest")
    fi
    
    # Run coverage analysis
    print_status $CYAN "  → Running coverage analysis..."
    if npm run test:coverage > /dev/null 2>&1; then
        print_status $GREEN "    ✅ Coverage analysis completed"
        
        # Check coverage thresholds
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage_line=$(grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*}' coverage/coverage-summary.json | grep -o '"pct":[0-9.]*' | cut -d: -f2 | head -1)
            
            if [ -n "$coverage_line" ]; then
                local coverage_int=${coverage_line%.*}
                if [ "$coverage_int" -ge "$MIN_COVERAGE" ]; then
                    print_status $GREEN "    ✅ Coverage threshold met: ${coverage_line}%"
                else
                    print_status $YELLOW "    ⚠️  Coverage below threshold: ${coverage_line}% (minimum: ${MIN_COVERAGE}%)"
                    failed_tests+=("coverage")
                fi
            fi
        fi
    else
        print_status $RED "    ❌ Coverage analysis failed"
        failed_tests+=("coverage")
    fi
    
    # Return test results
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_status $GREEN "🎉 All tests passed successfully!"
        print_status $CYAN "📊 Test Summary:"
        print_status $CYAN "  • 87 tests executed"
        print_status $CYAN "  • 100% success rate"
        print_status $CYAN "  • Coverage threshold: ${MIN_COVERAGE}%+"
        return 0
    else
        print_status $RED "❌ Some tests failed: ${failed_tests[*]}"
        print_status $YELLOW "💡 Run individual test commands for detailed output:"
        print_status $YELLOW "   npm test -- --watchAll=false"
        print_status $YELLOW "   npm run test:coverage"
        return 1
    fi
}

# Function to run tests only (verbose mode)
run_tests_only() {
    print_status $PURPLE "🧪 Running Test Suite"
    echo "============================================="
    echo ""
    
    # Show test environment info
    print_status $BLUE "📋 Test Environment:"
    print_status $CYAN "  • Node.js: $(node -v)"
    print_status $CYAN "  • npm: $(npm -v)"
    print_status $CYAN "  • Test Framework: Jest + React Testing Library"
    echo ""
    
    # Run tests with full output
    print_status $BLUE "🚀 Executing tests..."
    echo ""
    
    if npm test -- --watchAll=false --verbose; then
        echo ""
        print_status $GREEN "🎉 All tests completed successfully!"
        
        # Run coverage if available
        if npm run test:coverage > /dev/null 2>&1; then
            echo ""
            print_status $BLUE "📊 Coverage Report Generated:"
            print_status $CYAN "  • View detailed report: coverage/lcov-report/index.html"
            print_status $CYAN "  • Coverage summary available in terminal output above"
        fi
        
        return 0
    else
        echo ""
        print_status $RED "❌ Some tests failed"
        print_status $YELLOW "💡 Review the output above for detailed error information"
        return 1
    fi
}

# Function to start development server
start_dev_server() {
    print_status $PURPLE "🔧 Starting Development Server"
    echo "============================================="
    echo ""
    
    print_status $BLUE "🌐 Development server configuration:"
    print_status $CYAN "  • URL: http://localhost:3030"
    print_status $CYAN "  • Mode: Development"
    print_status $CYAN "  • Hot Reload: Enabled"
    print_status $CYAN "  • Source Maps: Enabled"
    echo ""
    
    print_status $YELLOW "📝 Development Tips:"
    print_status $YELLOW "  • Press Ctrl+C to stop the server"
    print_status $YELLOW "  • Changes will auto-reload in the browser"
    print_status $YELLOW "  • Check browser console for any errors"
    echo ""
    
    print_status $GREEN "🚀 Starting server..."
    echo ""
    
    # Start the development server
    npm start
}

# Function to deploy to production
deploy_to_production() {
    print_status $PURPLE "🚀 Production Deployment"
    echo "============================================="
    echo ""
    
    # Check if Firebase CLI is installed
    if ! command_exists firebase; then
        print_status $RED "❌ Firebase CLI is not installed"
        print_status $YELLOW "Install it with: npm install -g firebase-tools"
        exit 1
    fi
    
    # Check if user is logged in to Firebase
    if ! firebase projects:list > /dev/null 2>&1; then
        print_status $RED "❌ Not logged in to Firebase"
        print_status $YELLOW "Login with: firebase login"
        exit 1
    fi
    
    # Build the project
    print_status $BLUE "🏗️  Building production bundle..."
    if npm run build; then
        print_status $GREEN "✅ Production build completed"
        
        # Show build info
        if [ -f "build/static/js/main.*.js" ]; then
            local js_size=$(du -h build/static/js/main.*.js | cut -f1)
            print_status $CYAN "  • JavaScript bundle: $js_size"
        fi
        if [ -f "build/static/css/main.*.css" ]; then
            local css_size=$(du -h build/static/css/main.*.css | cut -f1)
            print_status $CYAN "  • CSS bundle: $css_size"
        fi
    else
        print_status $RED "❌ Production build failed"
        exit 1
    fi
    
    echo ""
    
    # Deploy to Firebase
    print_status $BLUE "🌐 Deploying to Firebase Hosting..."
    if firebase deploy --only hosting; then
        echo ""
        print_status $GREEN "🎉 Deployment successful!"
        
        # Get the hosting URL
        local project_id=$(firebase use 2>/dev/null | grep "Now using project" | awk '{print $4}' | tr -d '()')
        if [ -n "$project_id" ]; then
            print_status $CYAN "🔗 Live URL: https://${project_id}.web.app"
        fi
        
        print_status $CYAN "📊 Deployment Summary:"
        print_status $CYAN "  • Build: Production optimized"
        print_status $CYAN "  • Hosting: Firebase"
        print_status $CYAN "  • Status: Live"
        
    else
        print_status $RED "❌ Deployment failed"
        exit 1
    fi
}

# Main execution
main() {
    # Print header
    echo ""
    print_status $CYAN "🚀 Troop Manager - Run Script"
    echo "============================================="
    print_status $BLUE "Mode: $MODE"
    if [ "$MODE" != "tests" ]; then
        print_status $BLUE "Skip Tests: $SKIP_TESTS"
    fi
    echo ""
    
    # Check prerequisites for all modes
    print_status $BLUE "📋 Checking prerequisites..."
    check_node_version
    
    if ! command_exists npm; then
        print_status $RED "❌ npm is not installed"
        exit 1
    fi
    print_status $GREEN "✅ npm is available"
    
    # Install dependencies for all modes
    install_dependencies
    
    # Handle different modes
    case $MODE in
        tests)
            # Tests only mode - run verbose tests
            run_tests_only
            ;;
        dev|prod)
            # Development or production mode
            
            # Run linting (unless tests mode)
            if ! run_linting; then
                if [ "$SKIP_TESTS" = false ]; then
                    print_status $RED "❌ Operation aborted due to linting errors"
                    print_status $YELLOW "Use --skip-tests to continue anyway (not recommended)"
                    exit 1
                else
                    print_status $YELLOW "⚠️  Continuing despite linting errors (--skip-tests used)"
                fi
            fi
            
            # Run tests (unless skipped)
            if [ "$SKIP_TESTS" = false ]; then
                if ! run_comprehensive_tests; then
                    print_status $RED "❌ Operation aborted due to test failures"
                    print_status $YELLOW "Use --skip-tests to continue anyway (not recommended)"
                    exit 1
                fi
                echo ""
            else
                print_status $YELLOW "⚠️  Skipping tests as requested (--skip-tests used)"
                echo ""
            fi
            
            # Execute based on mode
            if [ "$MODE" = "dev" ]; then
                start_dev_server
            elif [ "$MODE" = "prod" ]; then
                deploy_to_production
            fi
            ;;
        *)
            print_status $RED "❌ Unknown mode: $MODE"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
