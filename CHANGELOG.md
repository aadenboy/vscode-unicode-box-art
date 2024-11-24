# Change Log

![Active issues](https://img.shields.io/github/issues/aadenboy/vscode-unicode-box-art
) ![Pull requests](https://img.shields.io/github/issues-pr/aadenboy/vscode-unicode-box-art
)

## 1.0.0 - November 23rd, 2024
- Remapped `Ctrl+Shift+N`, `Ctrl+Shift+B`, `Ctrl+Shift+K` and `Ctrl+Shift+Delete` to simply `N`, `B`, `K` and `Delete` respectively
- Redid the character map slightly
- Fixed multi-cursor support
- Added transformation
    - `[` Rotate left
    - `]` Rotate right
    - `Shift+[` Flip horizontally
    - `Shift+]` Flip vertically
- Added paintng
    - `Alt`+Arrow Keys to paint as you move
    - `Shift+Alt`+Arrow Keys to only paint a segment
    - Painting is different from drawing, overwriting lines instead of creating lines
- Added batch-painting
    - `-` to paint a line (no turning, no splitting)
    - `Shift+-` to paint a curve (no splitting)
    - `Alt+-` to paint a branch (no turning)
    - `Ctrl+-` to paint a shape
    - You can use these with the eraser to delete instead
- Other changes

## 0.0.2 - November 10th, 2024
- Bug fixes related to *Double* line style
- Redid cursor movement
- Multi-cursor support
- Clicking to move cursor now automatically selects the character

## 0.0.1 - November 9th, 2024
- Initial release