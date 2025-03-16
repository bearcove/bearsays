# this is a Justfile, not a makefile

linux-builder-image:
    #!/bin/bash -eux
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    docker build --file linux-builder.Dockerfile --tag "${TAG}" .
    docker inspect --size "${TAG}"
    docker run --rm "${TAG}" rustc --version

linux-builder-image-push:
    #!/bin/bash -eux
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    docker push "${TAG}"
