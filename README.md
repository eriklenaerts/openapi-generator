# Open API Document Generator

Generate new Open API documents based on your own API REST guidelines. 

## Basic usage

``` bash
> npm install -g @eriklenaerts/openapi-docgen
> cd your-app
> openapi-docgen
```

## Development

To debug:
- set `Toggle Auto Attach` to smart or always using Command Palette (`⇧⌘P`), restart Terminal, see also https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach
- open the code in Visual Studio Code. 
- set breakpoints in the code
- type `node bin/generator` in a terminal

# Publish this package on npm
- increase version number in the `package.json` file
- ececute the `npm publish` command in a terminal
- FYI: to check all versions of this package so far on npm, execute `npm show @eriklenaerts/openapi-docgen versions --json`
  