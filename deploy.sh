#!/bin/bash -eux

# RusCraft: хук build_www.sh (вызывается как ./deploy.sh <RELEASE_UUID> из корня).
# Добавляет в релиз игровой пак minetest_game (пин из versions.lock), чтобы RusCraft
# запускался в свою игру без похода в ContentDB.
#
# Формат пака повторяет base.pack харнесса: tar.zst, корень распаковки = дерево
# монтирования /luanti, т.е. внутри luanti/games/minetest_game/**.

source common.sh

RELEASE_UUID="$1"
PACKS_DIR="$WWW_DIR/$RELEASE_UUID/packs"
test -d "$PACKS_DIR"

MTG_SHA=$(grep '^minetest_game=' versions.lock | cut -d= -f2 | awk '{print $1}')
test -n "$MTG_SHA"

MTG_DIR="$SOURCES_DIR/minetest_game"   # каталог уже в .gitignore харнесса
if [ ! -d "$MTG_DIR/.git" ]; then
    git clone --quiet https://github.com/luanti-org/minetest_game.git "$MTG_DIR"
fi
if ! git -C "$MTG_DIR" cat-file -e "${MTG_SHA}^{commit}" 2>/dev/null; then
    git -C "$MTG_DIR" fetch --quiet origin || true
    git -C "$MTG_DIR" fetch --quiet --depth=1 origin "$MTG_SHA" || true
fi
git -C "$MTG_DIR" checkout -q "$MTG_SHA"
test "$(git -C "$MTG_DIR" rev-parse HEAD)" = "$MTG_SHA"

STAGE="$BUILD_DIR/ruscraft-mtg-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE/luanti/games"
cp -a "$MTG_DIR" "$STAGE/luanti/games/minetest_game"
rm -rf "$STAGE/luanti/games/minetest_game/.git" \
       "$STAGE/luanti/games/minetest_game/.github" \
       "$STAGE/luanti/games/minetest_game/.gitattributes"

rm -f "$BUILD_DIR/minetest_game.tar"
( cd "$STAGE" && tar cf "$BUILD_DIR/minetest_game.tar" . )
zstd -q --ultra -22 -f "$BUILD_DIR/minetest_game.tar" \
     -o "$PACKS_DIR/minetest_game.pack"

ls -l "$PACKS_DIR"
echo "deploy.sh: пак minetest_game @ $MTG_SHA установлен в релиз $RELEASE_UUID"
