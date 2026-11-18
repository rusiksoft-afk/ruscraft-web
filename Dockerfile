FROM ubuntu:22.04

# RusCraft: профиль сборки (release|profile|debug) — см. common.sh
ARG BUILD_KIND=release
ENV BUILD_KIND=${BUILD_KIND}

# install deps
RUN \
	   apt-get update \
	&& DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
		wget \
		python3 \
		git \
		build-essential \
		cmake \
		tclsh \
		zip \
		zstd \
		gettext

# RusCraft: харнесс требует Node 24.x (install_emsdk.sh), которого в ubuntu:22.04 нет.
# Официальный tarball — детерминированно, без сторонних apt-репозиториев.
ARG NODE_VERSION=v24.22.3
RUN wget -qO- "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" \
	| tar -xJ -C /usr/local --strip-components=1 \
	&& node --version

COPY . /luanti-wasm

# Build luanti-wasm (в конце build_www.sh дёргает наш deploy.sh — игровой пак и пр.)
RUN \
	   cd /luanti-wasm \
	&& ls -la \
        && ./install_emsdk.sh \
	&& ./build_all.sh
