# FiveM Project Creator

A VS Code extension for quickly creating FiveM script projects with templates and configurations.

## Features

This extension helps you create FiveM script projects with:
- Basic project structure
- Optional GUI setup with jQuery
- Optional SQL database integration
- Automatic FXManifest configuration
- ESX framework support

## Usage

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Type "Create FiveM Project" and select it
3. Follow the prompts:
   - Enter project name
   - Choose whether to include GUI
   - Choose whether to include SQL support
   - Specify project location

## Project Structure

The created project will have this structure:
```
your-project/
├── fxmanifest.lua
├── config.lua
├── client/
│   └── rcn.client.lua
├── server/
│   └── rcn.server.lua
└── html/           # (if GUI is enabled)
    ├── index.html
    ├── css/
    │   └── app.css
    └── js/
        ├── app.js
        └── jquery.js
```

## Requirements

- VS Code 1.99.0 or higher
- FiveM server for testing

## Known Issues

No known issues at the moment.

## Release Notes

### 0.0.1
- Initial release
- Basic project structure creation
- GUI and SQL integration options
- ESX framework support

## Developer

RCN

## License

MIT

---

**Enjoy creating FiveM scripts!**
