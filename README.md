# rbxBinaryParser (WIP)

Roblox binary file reader for JavaScript.

# Using

The latest versions can be found in `dist/server` and `dist/client`.

WIP

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
