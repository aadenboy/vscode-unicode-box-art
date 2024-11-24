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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
// lmao enjoy this beautiful code fjahskdhsjd
function lowerVersion(currentVersion, targetVersion) {
    const parseVersion = (version) => version.split('.').map(num => parseInt(num, 10));
    const [major, minor, patch] = parseVersion(currentVersion);
    const [tmajor, tminor, tpatch] = parseVersion(targetVersion);
    if (major < tmajor)
        return true;
    if (major > tmajor)
        return false;
    if (minor < tminor)
        return true;
    if (minor > tminor)
        return false;
    return patch < tpatch;
}
async function message(what, button) {
    if (button) {
        const thing = await vscode.window.showInformationMessage(what, button, "Dismiss");
        if (thing == button)
            await vscode.commands.executeCommand('extension.open', 'aadenboy.box-art-draw');
        return;
    }
    vscode.window.showInformationMessage(what);
}
var lineType;
(function (lineType) {
    lineType[lineType["normal"] = 0] = "normal";
    lineType[lineType["double"] = 1] = "double";
    lineType[lineType["bold"] = 2] = "bold";
    lineType[lineType["erase"] = 3] = "erase";
})(lineType || (lineType = {}));
var drawMode;
(function (drawMode) {
    drawMode[drawMode["typing"] = 0] = "typing";
    drawMode[drawMode["drawing"] = 1] = "drawing";
})(drawMode || (drawMode = {}));
const posMap = {
    "up": { "x": 0, "y": -1 },
    "down": { "x": 0, "y": 1 },
    "left": { "x": -1, "y": 0 },
    "right": { "x": 1, "y": 0 },
};
let mode = drawMode.typing;
let currentLineType = 0;
let statusBarItem = null;
let isUpdating = false;
function activate(context) {
    function register(command, callback) {
        const disposable = vscode.commands.registerCommand(command, callback);
        context.subscriptions.push(disposable);
        return register;
    }
    // look ma, it looks like a switch case statement!
    register("extension.toggleDrawingMode", () => {
        mode = mode == drawMode.drawing ? drawMode.typing : drawMode.drawing;
        vscode.commands.executeCommand("setContext", "extension.isDrawing", mode);
        updateStatusBar();
        cursorSelectify(0, 0);
    })("extension.normalLineType", () => {
        currentLineType = lineType.normal;
        updateStatusBar();
    })("extension.doubleLineType", () => {
        currentLineType = lineType.double;
        updateStatusBar();
    })("extension.boldLineType", () => {
        currentLineType = lineType.bold;
        updateStatusBar();
    })("extension.eraseLineType", () => {
        currentLineType = lineType.erase;
        updateStatusBar();
    })("extension.moveUp", () => {
        handleMove(-1, 0, "up", false);
    })("extension.moveDown", () => {
        handleMove(1, 0, "down", false);
    })("extension.moveLeft", () => {
        handleMove(0, -1, "left", false);
    })("extension.moveRight", () => {
        handleMove(0, 1, "right", false);
    })("extension.movePaintUp", () => {
        handleMove(-1, 0, "up", true);
    })("extension.movePaintDown", () => {
        handleMove(1, 0, "down", true);
    })("extension.movePaintLeft", () => {
        handleMove(0, -1, "left", true);
    })("extension.movePaintRight", () => {
        handleMove(0, 1, "right", true);
    })("extension.setUp", () => {
        handleSet("up", false);
    })("extension.setDown", () => {
        handleSet("down", false);
    })("extension.setLeft", () => {
        handleSet("left", false);
    })("extension.setRight", () => {
        handleSet("right", false);
    })("extension.setPaintUp", () => {
        handleSet("up", true);
    })("extension.setPaintDown", () => {
        handleSet("down", true);
    })("extension.setPaintLeft", () => {
        handleSet("left", true);
    })("extension.setPaintRight", () => {
        handleSet("right", true);
    })("extension.flipHorizontal", () => {
        handleTransform("horizontal");
    })("extension.flipVertictal", () => {
        handleTransform("vertical");
    })("extension.rotateLeft", () => {
        handleTransform("left");
    })("extension.rotateRight", () => {
        handleTransform("right");
    })("extension.paintLine", () => {
        shapedh(false, false);
    })("extension.paintCurve", () => {
        shapedh(true, false);
    })("extension.paintShape", () => {
        shapedh(true, true);
    })("extension.paintBranch", () => {
        shapedh(false, true);
    })("extension.keybindNotif", () => {
        message("Hey, some keybinds have been adjusted! I suggest you view the changelog.", "View extension");
    });
    function shapedh(turn, split) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        Promise.race([
            lineStepper(editor, turn, split),
            new Promise((_, reject) => setTimeout(() => reject("Timeout!"), 1000))
        ])
            .catch(() => vscode.window.showWarningMessage("Took too long trying to paint the shape, or an error occurred (is it too complicated?)"));
    }
    const handleCursorMove = (event) => {
        if (!isUpdating && mode != drawMode.typing) {
            cursorSelectify(0, 0);
        }
        updateStatusBar();
    };
    const cursorMoveDisposable = vscode.window.onDidChangeTextEditorSelection(handleCursorMove);
    context.subscriptions.push(cursorMoveDisposable);
    initializeStatusBar();
    updateStatusBar();
    if (statusBarItem) {
        statusBarItem.command = "extension.showDrawingOptions";
    }
    register("extension.showDrawingOptions", () => {
        quickPickMenu();
    });
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
function handleMove(dx, dy, direction, paint) {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        editor.edit((editBuilder) => {
            editor.selections.map((cursor) => {
                try {
                    const position = cursor.active;
                    const newPosition = position.translate(dx, dy);
                    const currentChar = character(editor, position);
                    const newChar = character(editor, newPosition);
                    insertBoxLine(editBuilder, position, newPosition, direction, currentChar, newChar, paint);
                }
                catch { }
            });
        });
        cursorSelectify(dx, dy);
    }
    catch { }
}
function handleSet(direction, paint) {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        editor.edit((editBuilder) => {
            editor.selections.map((cursor, index) => {
                try {
                    const position = cursor.active;
                    const currentChar = character(editor, position);
                    modifyBoxLine(editBuilder, position, direction, currentChar, paint);
                }
                catch { }
            });
        });
        cursorSelectify(0, 0);
    }
    catch { }
}
function handleTransform(direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    editor.edit((editBuilder) => {
        editor.selections.map((cursor, index) => {
            try {
                const position = cursor.active;
                const currentChar = character(editor, position);
                transformBoxLine(editBuilder, position, direction, currentChar);
            }
            catch { }
        });
    });
    cursorSelectify(0, 0);
}
const charmaps_json_1 = __importDefault(require("./charmaps.json"));
let last = new vscode.Position(0, 0);
let dir = "up";
function insertBoxLine(editBuilder, position, newPosition, direction, currentChar, newChar, paint) {
    function replaceChar(position, newChar) {
        const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
        editBuilder.replace(range, newChar);
    }
    function mapcase(repset, dirFrom, dirTo, missingFrom, missingTo, newDir) {
        if (!paint) {
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
        else {
            last = new vscode.Position(0, 0);
            let curLine = dirFrom[currentChar][currentLineType + 4];
            let newLine = dirTo[newChar][currentLineType + 4];
            replaceChar(position, curLine);
            replaceChar(newPosition, newLine);
        }
    }
    switch (direction) {
        case "up":
            mapcase({
                "up": ["║", "║", "║", "║"],
                "down": ["║", "║", "║", " "],
                "left": ["╘", "╚", "╘", "═"],
                "right": ["╜", "╝", "╜", "═"]
            }, charmaps_json_1.default.down, charmaps_json_1.default.up, ["╵", " ", "╹", " "], ["╷", "║", "╻", " "], "up");
            break;
        case "down":
            mapcase({
                "up": ["║", "║", "║", " "],
                "down": ["║", "║", "║", "║"],
                "left": ["╒", "╔", "╒", "═"],
                "right": ["╕", "╗", "╕", "═"]
            }, charmaps_json_1.default.up, charmaps_json_1.default.down, ["╷", " ", "╻", " "], ["╵", "║", "╹", " "], "down");
            break;
        case "left":
            mapcase({
                "up": ["╖", "╗", "╖", "║"],
                "down": ["╜", "╝", "╜", "║"],
                "left": ["═", "═", "═", "═"],
                "right": ["═", "═", "═", " "]
            }, charmaps_json_1.default.right, charmaps_json_1.default.left, ["╴", " ", "╸", " "], ["╶", "═", "╺", " "], "left");
            break;
        case "right":
            mapcase({
                "up": ["╓", "╔", "╓", "║"],
                "down": ["╙", "╚", "╙", "║"],
                "left": ["═", "═", "═", " "],
                "right": ["═", "═", "═", "═"]
            }, charmaps_json_1.default.left, charmaps_json_1.default.right, ["╶", " ", "╺", " "], ["╴", "═", "╸", " "], "right");
            break;
    }
}
function modifyBoxLine(editBuilder, position, direction, currentChar, paint) {
    let newLine;
    function replaceChar(position, newChar) {
        editBuilder.replace(new vscode.Selection(position, position.translate(0, 1)), newChar);
    }
    last = new vscode.Position(0, 0);
    function mapcase(dir, missing) {
        if (!paint) {
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
        else {
            newLine = dir[currentChar];
            if (!newLine)
                return;
            replaceChar(position, newLine[currentLineType + 4]);
        }
    }
    switch (direction) {
        case "up":
            mapcase(charmaps_json_1.default.down, ["╵", "║", "╹", " "]);
            break;
        case "down":
            mapcase(charmaps_json_1.default.up, ["╷", "║", "╻", " "]);
            break;
        case "left":
            mapcase(charmaps_json_1.default.right, ["╴", "═", "╸", " "]);
            break;
        case "right":
            mapcase(charmaps_json_1.default.left, ["╶", "═", "╺", " "]);
            break;
    }
}
function transformBoxLine(editBuilder, position, direction, currentChar) {
    let newLine;
    function replaceChar(position, newChar) {
        const range = new vscode.Range(position, position.translate(0, 1)); // Range for one character
        editBuilder.replace(range, newChar);
    }
    last = new vscode.Position(0, 0);
    function mapcase(type) {
        newLine = charmaps_json_1.default.transform[currentChar];
        replaceChar(position, newLine[type]);
    }
    switch (direction) {
        case "horizontal":
            mapcase(0);
            break;
        case "vertical":
            mapcase(1);
            break;
        case "left":
            mapcase(2);
            break;
        case "right":
            mapcase(3);
            break;
    }
}
function replaceAt(string, index, replacement) {
    return string.substring(0, index) + replacement + string.substring(index + replacement.length);
}
function lineStepper(editor, turn, split) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject("timeout!");
        }, 1000);
        let field = editor.document.getText().split("\n");
        let pendingDirs = [];
        editor.selections.map((cursor) => {
            pendingDirs.push({ pos: cursor.active, dir: "up", noredo: true }, { pos: cursor.active, dir: "down", noredo: true }, { pos: cursor.active, dir: "left", noredo: true }, { pos: cursor.active, dir: "right", noredo: true });
        });
        let stepped = {
            "left": {},
            "right": {},
            "up": {},
            "down": {}
        };
        const nonsame = {
            "up": ["left", "right", "down"],
            "down": ["left", "right", "up"],
            "left": ["up", "down", "right"],
            "right": ["up", "down", "left"]
        };
        let mins = {
            "minx": Infinity,
            "miny": Infinity,
            "maxx": 0,
            "maxy": 0
        };
        while (pendingDirs.length >= 1) {
            try {
                let at = pendingDirs[0];
                let mapFrom = charmaps_json_1.default[nonsame[at.dir][2]];
                let mapTo = charmaps_json_1.default[at.dir];
                let from = at.pos;
                let to = at.pos.translate(posMap[at.dir].y, posMap[at.dir].x);
                let cfrom = field[from.line][from.character];
                let cto = field[to.line][to.character];
                const toKey = `${to.line},${to.character}`;
                const amt = (charmaps_json_1.default.transform[cfrom] || [0, 0, 0, 0, 0])[4];
                mins.minx = Math.min(from.character, to.character, mins.minx);
                mins.miny = Math.min(from.line, to.line, mins.miny);
                mins.maxx = Math.max(from.character, to.character, mins.maxx);
                mins.maxy = Math.max(from.line, to.line, mins.maxy);
                if ((mapFrom[cfrom] || ["", "", "", cfrom])[3] != cfrom) {
                    field[from.line] = replaceAt(field[from.line], from.character, mapFrom[cfrom][currentLineType + 4]);
                    if ((mapTo[cto] || ["", "", "", cto])[3] != cto && !stepped[at.dir][toKey]) {
                        stepped[at.dir][toKey] = true;
                        field[to.line] = replaceAt(field[to.line], to.character, mapTo[cto][currentLineType + 4]);
                        try {
                            pendingDirs.push({
                                pos: to,
                                dir: at.dir,
                                noredo: false,
                            });
                        }
                        catch { }
                    }
                    if (amt >= 3 && split && !at.noredo) {
                        try {
                            pendingDirs.push({
                                pos: from,
                                dir: nonsame[at.dir][0],
                                noredo: true,
                            });
                        }
                        catch { }
                        pendingDirs.push({
                            pos: from,
                            dir: nonsame[at.dir][1],
                            noredo: true,
                        });
                    }
                }
                else if (((amt <= 2 && turn) || (amt == 3 && split)) && !at.noredo) {
                    try {
                        pendingDirs.push({
                            pos: from,
                            dir: nonsame[at.dir][0],
                            noredo: true,
                        });
                    }
                    catch { }
                    try {
                        pendingDirs.push({
                            pos: from,
                            dir: nonsame[at.dir][1],
                            noredo: true,
                        });
                    }
                    catch { }
                }
            }
            catch { }
            ;
            pendingDirs.shift();
        }
        editor.edit((editBuilder) => {
            for (const [i, v] of field.entries()) {
                if (i < mins.miny)
                    continue;
                if (i > mins.maxy)
                    break;
                editBuilder.replace(new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, v.length)), v);
            }
        });
        resolve("done!");
    });
}
function character(editor, position) {
    const range = new vscode.Range(position, position.translate(0, 1));
    return editor.document.getText(range);
}
function initializeStatusBar() {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = "extension.showDrawingOptions";
        statusBarItem.show();
    }
}
function updateStatusBar() {
    if (statusBarItem) {
        const modeText = ["Normal Mode", "Drawing Mode"][mode];
        const modeIcon = ["$(code)", "$(pencil)",][mode];
        const typeText = mode != drawMode.typing ? ` (${["Normal", "Double", "Bold", "Erasing"][currentLineType]})` : "";
        statusBarItem.text = `${modeIcon} ${modeText}${typeText}`;
    }
}
function quickPickMenu() {
    const options = [
        { label: "$(pencil) Toggle Drawing", command: "extension.toggleDrawingMode" },
        { label: "├ Normal Line", command: "extension.normalLineType" },
        { label: "╠ Double Line", command: "extension.doubleLineType" },
        { label: "┣ Bold Line", command: "extension.boldLineType" },
        { label: "$(chrome-close) Eraser", command: "extension.eraseLineType" },
        { label: "$(paintcan) Paint Line", command: "extension.eraseLineType" },
        { label: "$(paintcan) Paint Curve", command: "extension.eraseLineType" },
        { label: "$(paintcan) Paint Branch", command: "extension.eraseLineType" },
        { label: "$(paintcan) Paint Shape", command: "extension.eraseLineType" }
    ];
    vscode.window.showQuickPick(options, {
        placeHolder: "Select an option",
    }).then((selection) => {
        if (selection) {
            vscode.commands.executeCommand(selection.command);
            updateStatusBar();
        }
    });
}
//# sourceMappingURL=extension.js.map