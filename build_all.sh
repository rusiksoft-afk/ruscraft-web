#!/bin/bash -eux

source common.sh

rm -rf "$BUILD_DIR"
rm -rf "$WWW_DIR"

# Emscripten comes with ports for most of these, but they don't compile
# with pthread support. Wipe the cache and build them ourselves.
emcc --clear-cache --clear-ports

./fetch_sources.sh

# Dependencies
./build_zstd.sh

# RusCraft: в install/lib должна оставаться только статика (.a): .so ломают
# try-run у autoconf (emscripten ищет libzstd.so рядом с CWD conftest'а → ENOENT,
# «cannot compute sizeof (wchar_t)», exit 77). Флаг ZSTD_BUILD_SHARED=OFF —
# основная починка, эта строка — страховка; дальше по этой же причине чистим
# перед libarchive, openssl/curl/libzip (у них статика включена флагами).
find "$INSTALL_DIR/lib" -name '*.so*' -delete || true
./build_libarchive.sh # uses zstd
./build_webshims.sh
./build_openssl.sh
./build_curl.sh      # uses webshims, openssl, zlib
./build_libzip.sh

# Luanti
./build_luanti.sh

# Virtual file system
./build_fsroot.sh

# Finished product
./build_www.sh
