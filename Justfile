linux-builder-image:
    docker build --file linux-builder.Dockerfile --tag code.bearcove.cloud/linux-builder:rust-1.85.0 .
    docker inspect --size code.bearcove.cloud/linux-builder:rust-1.85.0
    docker run --rm code.bearcove.cloud/linux-builder:rust-1.85.0 rust
