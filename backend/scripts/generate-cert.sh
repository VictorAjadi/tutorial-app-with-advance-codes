#!/bin/bash

# Create cert directory if it doesn't exist
mkdir -p cert

# Generate the private key and certificate
openssl req -nodes -new -x509 \
    -keyout ./cert/server.key \
    -out ./cert/server.cert \
    -subj "/C=US/ST=State/L=City/O=Company/OU=Org/CN=www.testserver.local"
