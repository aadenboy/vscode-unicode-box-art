"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertBoxLine = insertBoxLine;
// Function to insert box drawing lines at a specific position
function insertBoxLine(editor, position, isVertical = false) {
    editor.edit(editBuilder => {
        const char = isVertical ? '│' : '─'; // Vertical or horizontal line
        editBuilder.insert(position, char);
    });
}
//# sourceMappingURL=keybindings.js.map