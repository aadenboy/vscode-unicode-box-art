# Unicode Box Art Draw

![Title Animation](bd.gif)

This extension lets you draw with Unicode's box art characters directly in VSCode!

> Based on [MarkLodato/js-boxdrawing](https://github.com/MarkLodato/js-boxdrawing)

## Usage

All keybinds, excluding the toggle command, are active only while drawing mode is enabled.

### Commands
- `Ctrl+Shift+Insert` - **Toggle Drawing Mode**: Switches between drawing and regular typing.
- **Line Styles**:
  - `Ctrl+Shift+N` - Set to *Normal* line style
  - `Ctrl+Shift+B` - Set to *Bold* line style
  - `Ctrl+Shift+K` - Set to *Double* line style
  - `Ctrl+Shift+Delete` - Erase lines
- **Drawing**:
  - Arrow Keys - Draw a line in the chosen style
  - `Shift`+Arrow Keys - Draw a piece of a line in-place without moving the cursor

## Notes/Issues

- The *Double* line style may behave inconsistently due to a limited character set compared to *Normal* and *Bold*.
   - Interaction between *Double* and *Bold* lines may be unintuitive due to the limited range of compatible Unicode characters.
- Lines will not automatically pad to the cursor, so manual alignment may be needed.

## Installation

1. Open the Extensions view in VS Code (`Ctrl+Shift+X`)
2. Search for **"Unicode Box Art Drawing"** and install it
3. Start drawing by toggling drawing mode with `Ctrl+Shift+Insert`!

## Source Code
You can view and contribute to the source code at [GitHub Repo](https://github.com/aadenboy/vscode-unicode-box-art).
