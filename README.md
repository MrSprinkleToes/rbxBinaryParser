# rbxBinaryParser

Roblox binary file reader for JavaScript.

A `.rbxl` or `.rbxm` file is passed to the library as an ArrayBuffer, which is then read and decoded into an Object representing the contents of the file.

# Using

The latest versions can be found in `dist/server` and `dist/client`.

To use this library, copy either `dist/client/rbxBinaryParser.js` or `dist/client/server/rbxBinaryParser.js` to your project.

You can import the library like so:
| Server | Browser |
| ------ | ------- |
| `const { decode } = require("path/to/rbxBinaryParser");` | `import { decode } from "rbxBinaryParser.js";` |

To decode a Roblox binary file (`rbxm` or `rbxl`), you need to pass it as an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) to the `decode` function. This will return an array containing an `Object` representing each instance in the file. These objects contain the instance's properties and their values, along with a `.Children` property which is an array of objects representing the children of the instance.

# Building

Contributions to this project are welcome!

To build this project, you need to install webpack.
This can be done by running `npm i --save-dev webpack webpack-cli`. (make sure you have npm installed!)

With webpack installed, open the project directory and run:

| Command | Function |
| ------------- | ------------- |
| `npm run build` | Builds for both server and client in production mode. |
| `npm run build:[client,server]` | Builds for either server or client in production mode. |
| `npm run buildDev` | Builds for both server and client in development mode. |
| `npm run buildDev:[client,server]` | Builds for either server or client in development mode. |

Production builds are minified and have little sourcemapping, while development builds are less minified and have heavier sourcemapping to allow for easier debugging.
