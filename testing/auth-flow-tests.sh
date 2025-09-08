#!/bin/bash

# 🧪 Authentication Flow Test Runner
# Runs comprehensive tests for all authentication workflows

set -e

echo "🔐 Starting Authentication Flow Tests..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test categories
TESTS=(
  "Registration & Account Setup Flow"
  "Password Reset Flow" 
  "Regular Login Flow"
  "Token Cleanup Integration"
  "Error Boundary Testing"
)

echo -e "${BLUE}📋 Test Categories:${NC}"
for i in "${!TESTS[@]}"; do
  echo -e "  $((i+1)). ${TESTS[$i]}"
done
echo ""

# Run the authentication flow tests
echo -e "${YELLOW}🚀 Running Authentication Flow Tests...${NC}"
echo ""

# Set test environment
export NODE_ENV=test
export CI=true

# Run specific test file with verbose output
npx jest src/__tests__/integration/authenticationFlows.test.js \
  --verbose \
  --coverage \
  --coverageDirectory=coverage/auth-flows \
  --collectCoverageFrom="src/services/authService.js" \
  --collectCoverageFrom="src/components/RegistrationForm.js" \
  --collectCoverageFrom="src/pages/Users.js" \
  --collectCoverageFrom="src/pages/ResetPassword.js" \
  --collectCoverageFrom="src/pages/Login.js" \
  --testTimeout=30000

# Check test results
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All Authentication Flow Tests Passed!${NC}"
  echo ""
  
  # Display coverage summary
  echo -e "${BLUE}📊 Coverage Summary:${NC}"
  echo "Coverage report generated in: coverage/auth-flows/"
  
  # Optional: Open coverage report
  if command -v open &> /dev/null; then
    echo -e "${YELLOW}💡 Tip: Run 'open coverage/auth-flows/lcov-report/index.html' to view detailed coverage${NC}"
  fi
  
else
  echo ""
  echo -e "${RED}❌ Authentication Flow Tests Failed!${NC}"
  echo -e "${YELLOW}💡 Check the output above for details${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🔍 Test Categories Covered:${NC}"
echo -e "  ✅ Registration form submission and validation"
echo -e "  ✅ Admin approval workflow"
echo -e "  ✅ Account setup (Google & password)"
echo -e "  ✅ Password reset request and completion"
echo -e "  ✅ Login flows (Google & email/password)"
echo -e "  ✅ Token cleanup and security"
echo -e "  ✅ Error handling and edge cases"
echo ""

echo -e "${GREEN}🎉 Authentication Flow Testing Complete!${NC}"
