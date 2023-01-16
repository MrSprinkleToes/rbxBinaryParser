# rbxBinaryParser
Roblox binary file reader for JavaScript.

# Using
The latest version can be found at `dist/rbxBinaryParser.js`
WIP

# Building
Contributions to this project are welcome!

To build this project, you need to install [@vercel/ncc](https://www.npmjs.com/package/@vercel/ncc).
This can be done by running `npm i -g @vercel/ncc`. (make sure you have npm installed!)

With ncc installed, open the project directory and run `npm run build`.

This runs a script which executes the commands:
1. `del dist\\rbxBinaryParser.js` - Deletes the previous build
2. `ncc build src/index.js` - Builds the project starting at the main file `src/index.js`.
3. `ren dist\\index.js rbxBinaryParser.js` - Renames the built project from `index.js` to `rbxBinaryParser.js`.
