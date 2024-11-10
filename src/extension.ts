import * as vscode from 'vscode';

// lmao enjoy this beautiful code fjahskdhsjd

enum lineType {
	normal,
	double,
	bold,
	erase
}

export let isDrawingMode = false;
let currentLineType = 0
let statusBarItem: vscode.StatusBarItem | null = null;

export function activate(context: vscode.ExtensionContext) {

    const toggleModeDisposable = vscode.commands.registerCommand('extension.toggleDrawingMode', () => {
        isDrawingMode = !isDrawingMode;
		vscode.commands.executeCommand('setContext', 'extension.isDrawingMode', isDrawingMode);
        updateStatusBar();
    });

	const normalLineDisposable = vscode.commands.registerCommand('extension.normalLineType', () => {
        currentLineType = lineType.normal
		updateStatusBar();
    });
	const doubleLineDisposable = vscode.commands.registerCommand('extension.doubleLineType', () => {
        currentLineType = lineType.double
		updateStatusBar();
    });
	const boldLineDisposable = vscode.commands.registerCommand('extension.boldLineType', () => {
        currentLineType = lineType.bold
		updateStatusBar();
    });
	const eraseLineDisposable = vscode.commands.registerCommand('extension.eraseLineType', () => {
        currentLineType = lineType.erase
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

    context.subscriptions.push(
        toggleModeDisposable,
        moveUpDisposable,
        moveDownDisposable,
        moveLeftDisposable,
        moveRightDisposable,
		normalLineDisposable,
		doubleLineDisposable,
		boldLineDisposable,
		eraseLineDisposable,
		setUpDisposable,
		setDownDisposable,
		setLeftDisposable,
		setRightDisposable
    );

    initializeStatusBar();
    updateStatusBar();

	if (statusBarItem) {
        statusBarItem.command = 'extension.showDrawingOptions';
    }

    const showDrawingOptions = vscode.commands.registerCommand('extension.showDrawingOptions', () => {
        quickPickMenu();
    });
}


function handleMove(direction: 'up' | 'down' | 'left' | 'right') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = editor.selection.active;
    const newPosition = getNewPosition(position, direction);

    const currentChar = character(editor, position);
    const newChar = character(editor, newPosition);

    editor.selection = new vscode.Selection(newPosition.translate(0, 1), newPosition);
    insertBoxLine(editor, position, newPosition, direction, currentChar, newChar);
}

function handleSet(direction: 'up' | 'down' | 'left' | 'right') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const position = editor.selection.active;
    const currentChar = character(editor, position);

    editor.selection = new vscode.Selection(position.translate(0, 1), position);
    modifyBoxLine(editor, position, direction, currentChar,);
}

function getNewPosition(position: vscode.Position, direction: 'up' | 'down' | 'left' | 'right'): vscode.Position {
    switch (direction) {
        case 'up': return position.with(position.line - 1, position.character);
        case 'down': return position.with(position.line + 1, position.character);
        case 'left': return position.with(position.line, position.character - 1);
        case 'right': return position.with(position.line, position.character + 1);
    }
}

import charmap from "./charmaps.json";
let last = new vscode.Position(0, 0);
let dir: 'up' | 'down' | 'left' | 'right' = "up";

function insertBoxLine(editor: vscode.TextEditor, position: vscode.Position, newPosition: vscode.Position, direction: 'up' | 'down' | 'left' | 'right', currentChar: string, newChar: string) {
    let curLine, newLine;
	editor.edit(editBuilder => {
		function replaceChar(position: vscode.Position, newChar: string) {
			const range = new vscode.Range(position, position.translate(0, 1));  // Range for one character
			editBuilder.replace(range, newChar);
		}
		
        switch (direction) {
			case 'up':
				curLine = charmap.down[currentChar as keyof object];
				newLine =   charmap.up[newChar     as keyof object];
				if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
					replaceChar(position, {
						"up":    "║",
						"down":  "║",
						"left":  "╚",
						"right": "╝"
					}[dir]);
				} else {
					replaceChar(position,    (curLine || ["╵", " ", "╹", " "])[currentLineType]);
				}
					if (newLine == null) {last = newPosition; dir = 'up';}
				replaceChar(newPosition, (newLine || ["╷", "║", "╻", " "])[currentLineType]);
				break;
			case 'down':
				curLine =   charmap.up[currentChar as keyof object];
				newLine = charmap.down[newChar     as keyof object];
				if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
					replaceChar(position, {
						"up":    "║",
						"down":  "║",
						"left":  "╔",
						"right": "╗"
					}[dir]);
				} else {
					replaceChar(position,    (curLine || ["╷", " ", "╻", " "])[currentLineType]);
				}
					if (newLine == null) {last = newPosition; dir = 'down';}
				replaceChar(newPosition, (newLine || ["╵", "║", "╹", " "])[currentLineType]);
				break;
			case 'left':
				curLine = charmap.right[currentChar as keyof object];
				newLine =  charmap.left[newChar     as keyof object];
				if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
					replaceChar(position, {
						"up":    "╗",
						"down":  "╝",
						"left":  "═",
						"right": "═"
					}[dir]);
				} else {
					replaceChar(position,    (curLine || ["╴", " ", "╸", " "])[currentLineType]);
				}
					if (newLine == null) {last = newPosition; dir = 'left';}
				replaceChar(newPosition, (newLine || ["╶", "═", "╺", " "])[currentLineType]);
				break;
			case 'right':
				curLine =  charmap.left[currentChar as keyof object];
				newLine = charmap.right[newChar     as keyof object];
				if (last.compareTo(position) == 0 && currentLineType == lineType.double) {
					replaceChar(position, {
						"up":    "╔",
						"down":  "╚",
						"left":  "═",
						"right": "═"
					}[dir]);
				} else {
					replaceChar(position,    (curLine || ["╶", " ", "╺", " "])[currentLineType]);
				}
					if (newLine == null) {last = newPosition; dir = 'right';}
				replaceChar(newPosition, (newLine || ["╴", "═", "╸", " "])[currentLineType]);
				break;
		}
    });
}

function modifyBoxLine(editor: vscode.TextEditor, position: vscode.Position, direction: 'up' | 'down' | 'left' | 'right', currentChar: string) {
	let newLine;
	editor.edit(editBuilder => {
		function replaceChar(position: vscode.Position, newChar: string) {
			const range = new vscode.Range(position, position.translate(0, 1));  // Range for one character
			editBuilder.replace(range, newChar);
		}
		last = new vscode.Position(0, 0);

		switch (direction) {
			case 'up':
				newLine = charmap.down[currentChar as keyof object];
				if (!newLine) {
					replaceChar(position, ["╵", "║", "╹", " "][currentLineType]);
					break;
				}
				if (newLine[currentLineType] == currentChar) {newLine = charmap.down[currentChar as keyof object][3]}
				else 						{newLine = newLine[currentLineType]};
				replaceChar(position, newLine);
				break;
			case 'down':
				newLine = charmap.up[currentChar as keyof object];
				if (!newLine) {
					replaceChar(position, ["╷", "║", "╻", " "][currentLineType]);
					break;
				}
				if (newLine[currentLineType] == currentChar) {newLine = charmap.up[currentChar as keyof object][3]}
				else 						{newLine = newLine[currentLineType]};
				replaceChar(position, newLine);
				break;
			case 'left':
				newLine = charmap.right[currentChar as keyof object];
				if (!newLine) {
					replaceChar(position, ["╴", "═", "╸", " "][currentLineType]);
					break;
				}
				if (newLine[currentLineType] == currentChar) {newLine = charmap.right[currentChar as keyof object][3]}
				else 						{newLine = newLine[currentLineType]};
				replaceChar(position, newLine);
				break;
			case 'right':
				newLine = charmap.left[currentChar as keyof object];
				if (!newLine) {
					replaceChar(position, ["╶", "═", "╺", " "][currentLineType]);
					break;
				}
				if (newLine[currentLineType] == currentChar) {newLine = charmap.left[currentChar as keyof object][3]}
				else 						{newLine = newLine[currentLineType]};
				replaceChar(position, newLine);
				break;
		}
	})
}

function character(editor: vscode.TextEditor, position: vscode.Position): string {
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

let cursorDecoration: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'rgba(0, 0, 0, 0)'
});;

function updateStatusBar() {
    if (statusBarItem) {
        const modeText = isDrawingMode ? 'Drawing Mode' : 'Normal Mode';
		const modeIcon = isDrawingMode ? '$(pencil)' : '$(code)';
		const typeText = isDrawingMode ? ` (${["Normal", "Double", "Bold", "Erasing"][currentLineType]})` : "";
        statusBarItem.text = `${modeIcon} ${modeText}${typeText}`;

		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const position = editor.selection.active;
		if (isDrawingMode) {
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
