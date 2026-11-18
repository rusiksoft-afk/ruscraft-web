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

COPY . /luanti-wasm

# Build luanti-wasm (в конце build_www.sh дёргает наш deploy.sh — игровой пак и пр.)
RUN \
	   cd /luanti-wasm \
	&& ls -la \
        && ./install_emsdk.sh \
	&& ./build_all.sh
