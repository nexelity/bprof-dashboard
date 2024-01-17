#!/bin/bash -ex

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Name of the builder
BUILDER_NAME=bprof-builder

# Docker image name and tag
IMAGE_NAME="nexelity/bprof-viewer"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# Target platforms
PLATFORMS="linux/amd64,linux/arm64"

# Build and push the image
docker buildx build -f ./docker/Dockerfile . --platform $PLATFORMS -t $FULL_IMAGE_NAME --push
