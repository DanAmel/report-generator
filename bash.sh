rm -rf ./dist/
mkdir -p dist/src

cp -r ./src/components  ./dist/src
cp -r ./src/render  ./dist/src
cp -r package.json  ./dist
cp -r index.js  ./dist
cp -r README.md  ./dist
