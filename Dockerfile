# Этап base: окружение сборки. Его использует CI (--target base), монтируя
# рабочую копию каталогом (/ci) — при падении логи configure остаются снаружи.
FROM ubuntu:22.04 AS base

# RusCraft: профиль сборки (release|profile|debug) — см. common.sh
ARG BUILD_KIND=release
ENV BUILD_KIND=${BUILD_KIND}

# install deps
# file/liblzma-dev/autoconf — RusCraft: без `file` autoconf-пробы libarchive
# («cannot compute sizeof (wchar_t)») падают в голом ubuntu:22.04.
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
		gettext \
		file \
		xz-utils \
		liblzma-dev \
		autoconf \
		automake \
		libtool \
		pkg-config

# RusCraft: харнесс требует Node 24.x (install_emsdk.sh), которого в ubuntu:22.04 нет.
# Официальный tarball — детерминированно, без сторонних apt-репозиториев.
ARG NODE_VERSION=v24.22.3
RUN wget -qO- "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" \
	| tar -xJ -C /usr/local --strip-components=1 \
	&& node --version

WORKDIR /luanti-wasm

# Этап full: монолитный образ со встроенной сборкой (как в апстриме) — удобно для
# локального docker-build. CI этот этап не использует.
FROM base AS full
COPY . /luanti-wasm
RUN ./install_emsdk.sh && ./build_all.sh
