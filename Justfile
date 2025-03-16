# this is a Justfile, not a makefile

update-formula:
    pnpm -C scripts install
    pnpm -C scripts check
    node scripts/src/update-formula.ts

linux-builder-image:
    #!/bin/bash -eux
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    docker build --file linux-builder.Dockerfile --tag "${TAG}" --platform linux/amd64 .
    docker inspect --size "${TAG}"
    docker run --rm --platform linux/amd64 "${TAG}" rustc --version

linux-builder-image-push:
    #!/bin/bash -eux
    just linux-builder-image
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    docker push "${TAG}"
