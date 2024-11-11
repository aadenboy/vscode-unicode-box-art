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
let isUpdating = false;
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
        handleMove(-1, 0, 'up');
    });
    const moveDownDisposable = vscode.commands.registerCommand('extension.moveDown', () => {
        handleMove(1, 0, 'down');
    });
    const moveLeftDisposable = vscode.commands.registerCommand('extension.moveLeft', () => {
        handleMove(0, -1, 'left');
    });
    const moveRightDisposable = vscode.commands.registerCommand('extension.moveRight', () => {
        handleMove(0, 1, 'right');
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
    const handleCursorMove = (event) => {
        if (!isUpdating && exports.isDrawingMode) {
            cursorSelectify(0, 0);
        }
        updateStatusBar();
    };
    const cursorMoveDisposable = vscode.window.onDidChangeTextEditorSelection(handleCursorMove);
    initializeStatusBar();
    updateStatusBar();
    if (statusBarItem) {
        statusBarItem.command = 'extension.showDrawingOptions';
    }
    const showDrawingOptions = vscode.commands.registerCommand('extension.showDrawingOptions', () => {
        quickPickMenu();
    });
    context.subscriptions.push(toggleModeDisposable, moveUpDisposable, moveDownDisposable, moveLeftDisposable, moveRightDisposable, normalLineDisposable, doubleLineDisposable, boldLineDisposable, eraseLineDisposable, setUpDisposable, setDownDisposable, setLeftDisposable, setRightDisposable, cursorMoveDisposable, showDrawingOptions);
}
function cursorSelectify(dx, dy) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    isUpdating = true;
    const updatedSelections = editor.selections.map((cursor) => {
        const position = cursor.active;
        return new vscode.Selection(position.translate(0 + dx, 1 + dy), position.translate(dx, dy));
    });
    editor.selections = updatedSelections;
    setTimeout(() => { isUpdating = false; }, 5);
}
function handleMove(dx, dy, direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    editor.edit((editBuilder) => {
        editor.selections.map((cursor) => {
            const position = cursor.active;
            const newPosition = position.translate(dx, dy);
            const currentChar = character(editor, position);
            const newChar = character(editor, newPosition);
            insertBoxLine(editBuilder, position, newPosition, direction, currentChar, newChar);
        });
    });
    cursorSelectify(dx, dy);
}
function handleSet(direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    editor.edit((editBuilder) => {
        editor.selections.map((cursor, index) => {
            const position = cursor.active;
            const currentChar = character(editor, position);
            modifyBoxLine(editBuilder, position, direction, currentChar);
        });
    });
    cursorSelectify(0, 0);
}
const charmaps_json_1 = __importDefault(require("./charmaps.json"));
let last = new vscode.Position(0, 0);
let dir = "up";
function insertBoxLine(editBuilder, position, newPosition, direction, currentChar, newChar) {
    function replaceChar(position, newChar) {
        const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
        editBuilder.replace(range, newChar);
    }
    function mapcase(repset, dirFrom, dirTo, missingFrom, missingTo, newDir) {
        let curLine = dirFrom[currentChar];
        let newLine = dirTo[newChar];
        // uhhh. ignore the weird syntaxing it just arose naturally
        if (last.compareTo(position) == 0) {
            replaceChar(position, repset[dir][currentLineType]);
        }
        else {
            replaceChar(position, (curLine || missingFrom)[currentLineType]);
        }
        if (newLine == null && currentLineType == lineType.double) {
            last = newPosition;
            dir = newDir;
        }
        else {
            last = new vscode.Position(0, 0);
        }
        replaceChar(newPosition, (newLine || missingTo)[currentLineType]);
    }
    switch (direction) {
        case 'up':
            mapcase({
                "up": ["║", "║", "║", "║"],
                "down": ["║", "║", "║", " "],
                "left": ["╘", "╚", "╘", "═"],
                "right": ["╜", "╝", "╜", "═"]
            }, charmaps_json_1.default.down, charmaps_json_1.default.up, ["╵", " ", "╹", " "], ["╷", "║", "╻", " "], 'up');
            break;
        case 'down':
            mapcase({
                "up": ["║", "║", "║", " "],
                "down": ["║", "║", "║", "║"],
                "left": ["╒", "╔", "╒", "═"],
                "right": ["╕", "╗", "╕", "═"]
            }, charmaps_json_1.default.up, charmaps_json_1.default.down, ["╷", " ", "╻", " "], ["╵", "║", "╹", " "], 'down');
            break;
        case 'left':
            mapcase({
                "up": ["╖", "╗", "╖", "║"],
                "down": ["╜", "╝", "╜", "║"],
                "left": ["═", "═", "═", "═"],
                "right": ["═", "═", "═", " "]
            }, charmaps_json_1.default.right, charmaps_json_1.default.left, ["╴", " ", "╸", " "], ["╶", "═", "╺", " "], 'left');
            break;
        case 'right':
            mapcase({
                "up": ["╓", "╔", "╓", "║"],
                "down": ["╙", "╚", "╙", "║"],
                "left": ["═", "═", "═", " "],
                "right": ["═", "═", "═", "═"]
            }, charmaps_json_1.default.left, charmaps_json_1.default.right, ["╶", " ", "╺", " "], ["╴", "═", "╸", " "], 'right');
            break;
    }
}
function modifyBoxLine(editBuilder, position, direction, currentChar) {
    let newLine;
    function replaceChar(position, newChar) {
        const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
        editBuilder.replace(range, newChar);
    }
    last = new vscode.Position(0, 0);
    function mapcase(dir, missing) {
        newLine = dir[currentChar];
        if (!newLine) {
            replaceChar(position, missing[currentLineType]);
            return;
        }
        if (newLine[currentLineType] == currentChar) {
            newLine = dir[currentChar][3];
        }
        else {
            newLine = newLine[currentLineType];
        }
        ;
        replaceChar(position, newLine);
    }
    switch (direction) {
        case 'up':
            mapcase(charmaps_json_1.default.down, ["╵", "║", "╹", " "]);
            break;
        case 'down':
            mapcase(charmaps_json_1.default.up, ["╷", "║", "╻", " "]);
            break;
        case 'left':
            mapcase(charmaps_json_1.default.right, ["╴", "═", "╸", " "]);
            break;
        case 'right':
            mapcase(charmaps_json_1.default.left, ["╶", "═", "╺", " "]);
            break;
    }
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