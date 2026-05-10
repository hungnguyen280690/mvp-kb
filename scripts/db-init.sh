#!/bin/bash
set -e
echo "=== VDBAS DB Init ==="

# Wait for Oracle listener to be ready
echo "Waiting for Oracle listener..."
while ! tnsping oracle:1521/FREEPDB1 > /dev/null 2>&1; do
  echo "Oracle listener not available yet. Retrying in 5 seconds..."
  sleep 5
done
echo "Oracle listener is ready."

# Wait a bit more for the database to be fully open
sleep 10

# Now connect and run setup
echo "Connecting to Oracle to run setup scripts..."
