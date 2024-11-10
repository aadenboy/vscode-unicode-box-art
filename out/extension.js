"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDrawingMode = void 0;
exports.activate = activate;
const vscode = __importStar(require("vscode"));
// lmao enjoy this beautiful code fjahskdhsjd
var lineType;
(function (lineType) {
    lineType[lineType["normal"] = 0] = "normal";
    lineType[lineType["double"] = 1] = "double";
    lineType[lineType["bold"] = 2] = "bold";
    lineType[lineType["erase"] = 3] = "erase";
})(lineType || (lineType = {}));
exports.isDrawingMode = false;
let currentLineType = 0;
let statusBarItem = null;
function activate(context) {
    const toggleModeDisposable = vscode.commands.registerCommand('extension.toggleDrawingMode', () => {
        exports.isDrawingMode = !exports.isDrawingMode;
        vscode.commands.executeCommand('setContext', 'extension.isDrawingMode', exports.isDrawingMode);
        updateStatusBar();
    });
    const normalLineDisposable = vscode.commands.registerCommand('extension.normalLineType', () => {
        currentLineType = lineType.normal;
        updateStatusBar();
    });
    const doubleLineDisposable = vscode.commands.registerCommand('extension.doubleLineType', () => {
        currentLineType = lineType.double;
        updateStatusBar();
    });
    const boldLineDisposable = vscode.commands.registerCommand('extension.boldLineType', () => {
        currentLineType = lineType.bold;
        updateStatusBar();
    });
    const eraseLineDisposable = vscode.commands.registerCommand('extension.eraseLineType', () => {
        currentLineType = lineType.erase;
        updateStatusBar();
    });
    const moveUpDisposable = vscode.commands.registerCommand('extension.moveUp', () => {
        handleMove('up');
    });
    const moveDownDisposable = vscode.commands.registerCommand('extension.moveDown', () => {
        handleMove('down');
    });
    const moveLeftDisposable = vscode.commands.registerCommand('extension.moveLeft', () => {
        handleMove('left');
    });
    const moveRightDisposable = vscode.commands.registerCommand('extension.moveRight', () => {
        handleMove('right');
    });
    const setUpDisposable = vscode.commands.registerCommand('extension.setUp', () => {
        handleSet('up');
    });
    const setDownDisposable = vscode.commands.registerCommand('extension.setDown', () => {
        handleSet('down');
    });
    const setLeftDisposable = vscode.commands.registerCommand('extension.setLeft', () => {
        handleSet('left');
    });
    const setRightDisposable = vscode.commands.registerCommand('extension.setRight', () => {
        handleSet('right');
    });
    context.subscriptions.push(toggleModeDisposable, moveUpDisposable, moveDownDisposable, moveLeftDisposable, moveRightDisposable, normalLineDisposable, doubleLineDisposable, boldLineDisposable, eraseLineDisposable, setUpDisposable, setDownDisposable, setLeftDisposable, setRightDisposable);
    initializeStatusBar();
    updateStatusBar();
    if (statusBarItem) {
        statusBarItem.command = 'extension.showDrawingOptions';
    }
    const showDrawingOptions = vscode.commands.registerCommand('extension.showDrawingOptions', () => {
        quickPickMenu();
    });
}
function handleMove(direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const position = editor.selection.active;
    const newPosition = getNewPosition(position, direction);
    const currentChar = character(editor, position);
    const newChar = character(editor, newPosition);
    editor.selection = new vscode.Selection(newPosition.translate(0, 1), newPosition);
    insertBoxLine(editor, position, newPosition, direction, currentChar, newChar);
}
function handleSet(direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const position = editor.selection.active;
    const currentChar = character(editor, position);
    editor.selection = new vscode.Selection(position.translate(0, 1), position);
    modifyBoxLine(editor, position, direction, currentChar);
}
function getNewPosition(position, direction) {
    switch (direction) {
        case 'up': return position.with(position.line - 1, position.character);
        case 'down': return position.with(position.line + 1, position.character);
        case 'left': return position.with(position.line, position.character - 1);
        case 'right': return position.with(position.line, position.character + 1);
    }
}
const charmaps_json_1 = __importDefault(require("./charmaps.json"));
let last = new vscode.Position(0, 0);
let dir = "up";
function insertBoxLine(editor, position, newPosition, direction, currentChar, newChar) {
    let curLine, newLine;
    editor.edit(editBuilder => {
        function replaceChar(position, newChar) {
            const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
            editBuilder.replace(range, newChar);
        }
        switch (direction) {
            case 'up':
                curLine = charmaps_json_1.default.down[currentChar];
                newLine = charmaps_json_1.default.up[newChar];
                if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
                    replaceChar(position, {
                        "up": "║",
                        "down": "║",
                        "left": "╚",
                        "right": "╝"
                    }[dir]);
                }
                else {
                    replaceChar(position, (curLine || ["╵", " ", "╹", " "])[currentLineType]);
                }
                if (newLine == null) {
                    last = newPosition;
                    dir = 'up';
                }
                replaceChar(newPosition, (newLine || ["╷", "║", "╻", " "])[currentLineType]);
                break;
            case 'down':
                curLine = charmaps_json_1.default.up[currentChar];
                newLine = charmaps_json_1.default.down[newChar];
                if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
                    replaceChar(position, {
                        "up": "║",
                        "down": "║",
                        "left": "╔",
                        "right": "╗"
                    }[dir]);
                }
                else {
                    replaceChar(position, (curLine || ["╷", " ", "╻", " "])[currentLineType]);
                }
                if (newLine == null) {
                    last = newPosition;
                    dir = 'down';
                }
                replaceChar(newPosition, (newLine || ["╵", "║", "╹", " "])[currentLineType]);
                break;
            case 'left':
                curLine = charmaps_json_1.default.right[currentChar];
                newLine = charmaps_json_1.default.left[newChar];
                if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
                    replaceChar(position, {
                        "up": "╗",
                        "down": "╝",
                        "left": "═",
                        "right": "═"
                    }[dir]);
                }
                else {
                    replaceChar(position, (curLine || ["╴", " ", "╸", " "])[currentLineType]);
                }
                if (newLine == null) {
                    last = newPosition;
                    dir = 'left';
                }
                replaceChar(newPosition, (newLine || ["╶", "═", "╺", " "])[currentLineType]);
                break;
            case 'right':
                curLine = charmaps_json_1.default.left[currentChar];
                newLine = charmaps_json_1.default.right[newChar];
                if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
                    replaceChar(position, {
                        "up": "╔",
                        "down": "╚",
                        "left": "═",
                        "right": "═"
                    }[dir]);
                }
                else {
                    replaceChar(position, (curLine || ["╶", " ", "╺", " "])[currentLineType]);
                }
                if (newLine == null) {
                    last = newPosition;
                    dir = 'right';
                }
                replaceChar(newPosition, (newLine || ["╴", "═", "╸", " "])[currentLineType]);
                break;
        }
    });
}
function modifyBoxLine(editor, position, direction, currentChar) {
    let newLine;
    editor.edit(editBuilder => {
        function replaceChar(position, newChar) {
            const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
            editBuilder.replace(range, newChar);
        }
        last = new vscode.Position(0, 0);
        switch (direction) {
            case 'up':
                newLine = charmaps_json_1.default.down[currentChar];
                if (!newLine) {
                    replaceChar(position, ["╵", "║", "╹", " "][currentLineType]);
                    break;
                }
                if (newLine[currentLineType] == currentChar) {
                    newLine = charmaps_json_1.default.down[currentChar][3];
                }
                else {
                    newLine = newLine[currentLineType];
                }
                ;
                replaceChar(position, newLine);
                break;
            case 'down':
                newLine = charmaps_json_1.default.up[currentChar];
                if (!newLine) {
                    replaceChar(position, ["╷", "║", "╻", " "][currentLineType]);
                    break;
                }
                if (newLine[currentLineType] == currentChar) {
                    newLine = charmaps_json_1.default.up[currentChar][3];
                }
                else {
                    newLine = newLine[currentLineType];
                }
                ;
                replaceChar(position, newLine);
                break;
            case 'left':
                newLine = charmaps_json_1.default.right[currentChar];
                if (!newLine) {
                    replaceChar(position, ["╴", "═", "╸", " "][currentLineType]);
                    break;
                }
                if (newLine[currentLineType] == currentChar) {
                    newLine = charmaps_json_1.default.right[currentChar][3];
                }
                else {
                    newLine = newLine[currentLineType];
                }
                ;
                replaceChar(position, newLine);
                break;
            case 'right':
                newLine = charmaps_json_1.default.left[currentChar];
                if (!newLine) {
                    replaceChar(position, ["╶", "═", "╺", " "][currentLineType]);
                    break;
                }
                if (newLine[currentLineType] == currentChar) {
                    newLine = charmaps_json_1.default.left[currentChar][3];
                }
                else {
                    newLine = newLine[currentLineType];
                }
                ;
                replaceChar(position, newLine);
                break;
        }
    });
}
function character(editor, position) {
    const range = new vscode.Range(position, position.translate(0, 1));
    return editor.document.getText(range);
}
function initializeStatusBar() {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'extension.showDrawingOptions';
        statusBarItem.show();
    }
}
let cursorDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 0, 0)'
});
;
function updateStatusBar() {
    if (statusBarItem) {
        const modeText = exports.isDrawingMode ? 'Drawing Mode' : 'Normal Mode';
        const modeIcon = exports.isDrawingMode ? '$(pencil)' : '$(code)';
        const typeText = exports.isDrawingMode ? ` (${["Normal", "Double", "Bold", "Erasing"][currentLineType]})` : "";
        statusBarItem.text = `${modeIcon} ${modeText}${typeText}`;
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const position = editor.selection.active;
        if (exports.isDrawingMode) {
            editor.selection = new vscode.Selection(position.translate(0, 1), position);
        }
    }
}
function quickPickMenu() {
    const options = [
        { label: '$(pencil) Toggle Drawing (Ctrl+Shift+Insert)', command: 'extension.toggleDrawingMode' },
        { label: '├ Normal Line (Ctrl+Shift+N)', command: 'extension.normalLineType' },
        { label: '╠ Double Line (Ctrl+Shift+K)', command: 'extension.doubleLineType' },
        { label: '┣ Bold Line (Ctrl+Shift+B)', command: 'extension.boldLineType' },
        { label: '$(chrome-close) Eraser (Ctrl+Shift+Delete)', command: 'extension.eraseLineType' }
    ];
    vscode.window.showQuickPick(options, {
        placeHolder: 'Select an option',
    }).then((selection) => {
        if (selection) {
            vscode.commands.executeCommand(selection.command);
            updateStatusBar();
        }
    });
}
//# sourceMappingURL=extension.js.map