#!/bin/bash

TEMP="build_temp"

# grab better-sqlite3 sqlite version
file=$(cat "node_modules/better-sqlite3/deps/download.sh")

version_regex="VERSION=\"([0-9]+)\""
if [[ $file =~ $version_regex ]]
then
	VERSION="${BASH_REMATCH[1]}"
else
	echo "Could not find SQLite version in node_modules/better-sqlite3/deps/download.sh" >&2
	exit 1
fi

year_regex="YEAR=\"([0-9]+)\""
if [[ $file =~ $year_regex ]]
then
	YEAR="${BASH_REMATCH[1]}"
else
	echo "Could not find SQLite year release in node_modules/better-sqlite3/deps/download.sh" >&2
	exit 1
fi

echo "Detected SQLite version $VERSION of year $YEAR"

# download source
rm -rf "$TEMP"
mkdir -p "$TEMP"
echo "downloading source..."
curl -#f "https://www.sqlite.org/$YEAR/sqlite-src-$VERSION.zip" > "$TEMP/source.zip" || exit 1

# extract source
echo "extracting source..."
unzip "$TEMP/source.zip" -d "$TEMP" > /dev/null || exit 1

# compile spellfix extension
echo "compiling spellfix extension..."
cd "$TEMP/sqlite-src-$VERSION"

# configure amalgamation
echo "configure amalgamation"
sh configure > /dev/null || exit 1

# make header files
echo "building header files"
make sqlite3.h > /dev/null || exit 1
make sqlite3ext.h > /dev/null || exit 1

system=$(uname -s)

if [[ $system = "Darwin" ]]
then
	gcc -I. -O3 -fPIC -dynamiclib ext/misc/spellfix.c -o spellfix.dylib || exit 1
	mv spellfix.dylib ../
	spellfix="spellfix.dylib"
elif [[ $system = "Linux" ]]
then
	gcc -I. -O3 -fPIC -shared ext/misc/spellfix.c -o spellfix.so || exit 1
	mv spellfix.so ../
	spellfix="spellfix.so"
else
	echo "Manual compialation of spellfix needed"
	exit 1
fi

# cleanup
cd ../..
if [[ ! -d "ext" ]]
then
	mkdir ext
fi

mv "$TEMP/$spellfix" ext
rm -rf "$TEMP"
