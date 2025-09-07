#!/bin/bash

# 🚀 Troop Manager Deployment Script
# Comprehensive script for development and production deployment
# Usage: ./deploy.sh [dev|prod] [--skip-tests]

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
MODE="dev"
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
    print_status $CYAN "🚀 Troop Manager Deployment Script"
    echo "=================================================="
    echo ""
    echo "Usage: ./deploy.sh [MODE] [OPTIONS]"
    echo ""
    echo "MODES:"
    echo "  dev     Start development server (default)"
    echo "  prod    Deploy to production"
    echo ""
    echo "OPTIONS:"
    echo "  --skip-tests    Skip running tests (works for both dev and prod)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                    # Start dev server with tests"
    echo "  ./deploy.sh dev --skip-tests   # Start dev server without tests"
    echo "  ./deploy.sh prod               # Deploy to production with tests"
    echo "  ./deploy.sh prod --skip-tests  # Deploy to production without tests"
    echo ""
}

# Parse command line arguments
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

# Function to run tests
run_tests() {
    local failed_tests=()
    
    print_status $BLUE "🧪 Running test suite..."
    
    # Run component tests
    print_status $CYAN "  → Running component tests..."
    if npm run test:components -- --watchAll=false > /dev/null 2>&1; then
        print_status $GREEN "    ✅ Component tests passed"
    else
        print_status $RED "    ❌ Component tests failed"
        failed_tests+=("components")
    fi
    
    # Run service tests
    print_status $CYAN "  → Running service tests..."
    if npm run test:services -- --watchAll=false > /dev/null 2>&1; then
        print_status $GREEN "    ✅ Service tests passed"
    else
        print_status $RED "    ❌ Service tests failed"
        failed_tests+=("services")
    fi
    
    # Run integration tests
    print_status $CYAN "  → Running integration tests..."
    if npm run test:integration -- --watchAll=false > /dev/null 2>&1; then
        print_status $GREEN "    ✅ Integration tests passed"
    else
        print_status $RED "    ❌ Integration tests failed"
        failed_tests+=("integration")
    fi
    
    # Run coverage tests
    print_status $CYAN "  → Running coverage analysis..."
    if npm run test:coverage > /dev/null 2>&1; then
        print_status $GREEN "    ✅ Coverage tests passed"
        
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
        print_status $RED "    ❌ Coverage tests failed"
        failed_tests+=("coverage")
    fi
    
    # Return test results
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_status $GREEN "🎉 All tests passed successfully!"
        return 0
    else
        print_status $RED "❌ Some tests failed: ${failed_tests[*]}"
        return 1
    fi
}

# Function to start development server
start_dev_server() {
    print_status $PURPLE "🔧 Starting development server..."
    print_status $CYAN "Server will be available at: http://localhost:3030"
    print_status $YELLOW "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the development server
    npm start
}

# Function to deploy to production
deploy_to_production() {
    print_status $PURPLE "🚀 Deploying to production..."
    
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
    else
        print_status $RED "❌ Production build failed"
        exit 1
    fi
    
    # Deploy to Firebase
    print_status $BLUE "🌐 Deploying to Firebase Hosting..."
    if firebase deploy --only hosting; then
        print_status $GREEN "🎉 Deployment successful!"
        print_status $CYAN "Your app is now live!"
        
        # Get the hosting URL
        local project_id=$(firebase use | grep "Now using project" | awk '{print $4}' | tr -d '()')
        if [ -n "$project_id" ]; then
            print_status $CYAN "🔗 URL: https://${project_id}.web.app"
        fi
    else
        print_status $RED "❌ Deployment failed"
        exit 1
    fi
}

# Main execution
main() {
    # Print header
    echo ""
    print_status $CYAN "🚀 Troop Manager Deployment Script"
    echo "=================================================="
    print_status $BLUE "Mode: $MODE"
    print_status $BLUE "Skip Tests: $SKIP_TESTS"
    echo ""
    
    # Check prerequisites
    print_status $BLUE "📋 Checking prerequisites..."
    check_node_version
    
    if ! command_exists npm; then
        print_status $RED "❌ npm is not installed"
        exit 1
    fi
    print_status $GREEN "✅ npm is available"
    
    # Install dependencies
    install_dependencies
    
    # Run linting
    if ! run_linting; then
        if [ "$SKIP_TESTS" = false ]; then
            print_status $RED "❌ Deployment aborted due to linting errors"
            print_status $YELLOW "Use --skip-tests to deploy anyway (not recommended)"
            exit 1
        else
            print_status $YELLOW "⚠️  Continuing despite linting errors (--skip-tests used)"
        fi
    fi
    
    # Run tests (unless skipped)
    if [ "$SKIP_TESTS" = false ]; then
        if ! run_tests; then
            print_status $RED "❌ Deployment aborted due to test failures"
            print_status $YELLOW "Use --skip-tests to deploy anyway (not recommended)"
            exit 1
        fi
    else
        print_status $YELLOW "⚠️  Skipping tests as requested (--skip-tests used)"
    fi
    
    # Execute based on mode
    case $MODE in
        dev)
            start_dev_server
            ;;
        prod)
            deploy_to_production
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
