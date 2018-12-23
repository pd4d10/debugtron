# Debugtron [![npm](https://img.shields.io/npm/v/debugtron.svg)](https://www.npmjs.com/package/debugtron)

Debugtron is a command line tool to debug Electron based app.

<img src="https://raw.githubusercontent.com/pd4d10/debugtron/master/assets/demo.gif" width="800" />

## Installation

```sh
npm install -g debugtron
```

You can also run `npx debugtron` to use it directly.

## Usage

```sh
debugtron
```

This command will list all possible Electron based apps installed, then you can select which app to debug.

If you want to debug specific app, run

```sh
debugtron [appPath]
```

For example:

```sh
debugtron /Application/Slack.app           # macOS
debugtron ~/AppData/Local/slack/slack.exe  # windows
```

## License

MIT
