#!/bin/bash

# File to read test commands from
COMMANDS_FILE="commands.txt"

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if the commands file exists
if [ ! -f "$COMMANDS_FILE" ]; then
    echo -e "${RED}Error: $COMMANDS_FILE not found in the current directory.${NC}"
    exit 1
fi

# Function to print a separator line
print_separator() {
    echo -e "\n${GREEN}------------------------------------------------------------------------${NC}"
}

# Read and execute each test command from the file
while IFS= read -r command || [[ -n "$command" ]]; do
    # Skip empty lines and comments
    if [[ -z "$command" ]] || [[ "$command" =~ ^[[:space:]]*# ]]; then
        continue
    fi

    print_separator
    echo -e "${GREEN}Running test: $command${NC}"
    print_separator

    eval "$command"
    
    # Check the exit status of the command
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Test failed: $command${NC}"
        exit 1
    fi

    echo -e "${GREEN}Test completed successfully.${NC}"
done < "$COMMANDS_FILE"

print_separator
echo -e "${GREEN}All tests executed successfully.${NC}"