# this is a Justfile, not a makefile

update-formula:
    pnpm -C scripts install
    pnpm -C scripts check
    node scripts/src/update-formula.ts

linux-builder-image:
    #!/bin/bash -eux
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    podman untag "${TAG}"
    podman build --file linux-builder.Containerfile --jobs $(nproc) --tag "${TAG}" --platform linux/amd64 .
    podman inspect --size "${TAG}"
    podman run --pull=never --rm --platform linux/amd64 "${TAG}" rustc --version
    podman run --pull=never --rm --platform linux/amd64 "${TAG}" cargo sweep --version
    podman run --pull=never --rm --platform linux/amd64 "${TAG}" cargo nextest --version
    podman run --pull=never --rm --platform linux/amd64 "${TAG}" timelord --version

linux-builder-image-push:
    #!/bin/bash -eux
    just linux-builder-image
    export TAG=code.bearcove.cloud/bearcove/linux-builder:rust-1.85.0
    podman push "${TAG}"
