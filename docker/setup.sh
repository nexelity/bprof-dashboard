#!/bin/bash -ex

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Name of the builder
BUILDER_NAME=bprof-builder

# Create a new builder and use it
docker buildx create --name $BUILDER_NAME --use

# Inspect the builder and ensure it's set up correctly
docker buildx inspect $BUILDER_NAME --bootstrap