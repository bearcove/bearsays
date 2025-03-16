FROM debian:trixie-slim
RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install --no-install-recommends -y \
    jq \
    autoconf \
    autotools-dev \
    curl \
    ca-certificates \
    pkg-config \
    libtool \
    libtool-bin \
    libpng-dev \
    libgtest-dev \
    clang \
    cmake \
    python3 \
    make \
    libprotobuf-dev \
    protobuf-compiler \
    libcurl4-openssl-dev \
    ninja-build \
    git \
    bsdmainutils \
    patch \
    bzip2 \
    nasm \
    libsqlite3-dev \
    libdav1d-dev && \
    rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.85.0
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup component add clippy
RUN rustup component add rustfmt
ENV CARGO_PROFILE_RELEASE_DEBUG="line-tables-only"
ENV CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO="packed"
ENV CC=clang
ENV CXX=clang++
# Install minimal dependencies for running Gitea/Forgejo Actions
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    curl \
    bash \
    git \
    coreutils \
    ca-certificates \
    openssh-client \
    tar \
    gzip \
    && rm -rf /var/lib/apt/lists/*
