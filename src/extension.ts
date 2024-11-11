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

let isUpdating = false;

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

	const handleCursorMove = (event: vscode.TextEditorSelectionChangeEvent) => {
		if (!isUpdating && isDrawingMode) {
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
		setRightDisposable,
		cursorMoveDisposable,
		showDrawingOptions
	);
}

function cursorSelectify(dx: number, dy: number) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	isUpdating = true;

	const updatedSelections = editor.selections.map((cursor) => {
		const position = cursor.active;
		return new vscode.Selection(position.translate(0 + dx, 1 + dy), position.translate(dx, dy));
	});

	editor.selections = updatedSelections;

	setTimeout(()=>{isUpdating = false;}, 5)
}

function handleMove(dx: number, dy: number, direction: 'up' | 'down' | 'left' | 'right') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

	editor.edit((editBuilder) => {
		editor.selections.map((cursor) => {
			const position = cursor.active;
			const newPosition = position.translate(dx, dy);

			const currentChar = character(editor, position);
			const newChar = character(editor, newPosition);
			insertBoxLine(editBuilder, position, newPosition, direction, currentChar, newChar);
		})
	})

	cursorSelectify(dx, dy)
}

function handleSet(direction: 'up' | 'down' | 'left' | 'right') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

	editor.edit((editBuilder) => {
		editor.selections.map((cursor, index) => {
			const position = cursor.active;
			const currentChar = character(editor, position);
			modifyBoxLine(editBuilder, position, direction, currentChar);
		})
	})

	cursorSelectify(0, 0)
}

import charmap from "./charmaps.json";
let last = new vscode.Position(0, 0);
let dir: 'up' | 'down' | 'left' | 'right' = "up";

function insertBoxLine(editBuilder: vscode.TextEditorEdit, position: vscode.Position, newPosition: vscode.Position, direction: 'up' | 'down' | 'left' | 'right', currentChar: string, newChar: string) {
	function replaceChar(position: vscode.Position, newChar: string) {
		const range = new vscode.Range(position, position.translate(0, 1));  // Range for one character
		editBuilder.replace(range, newChar);
	}

	function mapcase(repset: object, dirFrom: object, dirTo: object, missingFrom: object, missingTo: object, newDir: 'up' | 'down' | 'left' | 'right') {
		let curLine = dirFrom[currentChar as keyof object];
		let newLine =   dirTo[newChar     as keyof object];

		// uhhh. ignore the weird syntaxing it just arose naturally
		if (last.compareTo(position) == 0)
		{ replaceChar(position, repset[dir as keyof object][currentLineType]);
		} else
		{ replaceChar(position, (curLine || missingFrom)[currentLineType]);
		}

		if (newLine == null && currentLineType == lineType.double)
		{ last = newPosition; dir = newDir;
		} else
		{ last = new vscode.Position(0, 0);
		}

		replaceChar(newPosition, (newLine || missingTo)[currentLineType]);
	}
	
    switch (direction) {
		case 'up':
			mapcase({
				"up":    ["║", "║", "║", "║"],
				"down":  ["║", "║", "║", " "],
				"left":  ["╘", "╚", "╘", "═"],
				"right": ["╜", "╝", "╜", "═"]
			},
			charmap.down, charmap.up,
			["╵", " ", "╹", " "],
			["╷", "║", "╻", " "],
			'up');
			break;
		case 'down':
			mapcase({
				"up":    ["║", "║", "║", " "],
				"down":  ["║", "║", "║", "║"],
				"left":  ["╒", "╔", "╒", "═"],
				"right": ["╕", "╗", "╕", "═"]
			},
			charmap.up, charmap.down,
			["╷", " ", "╻", " "],
			["╵", "║", "╹", " "],
			'down');
			break;
		case 'left':
			mapcase({
				"up":    ["╖", "╗", "╖", "║"],
				"down":  ["╜", "╝", "╜", "║"],
				"left":  ["═", "═", "═", "═"],
				"right": ["═", "═", "═", " "]
			},
			charmap.right, charmap.left,
			["╴", " ", "╸", " "],
			["╶", "═", "╺", " "],
			'left');
			break;
		case 'right':
			mapcase({
				"up":    ["╓", "╔", "╓", "║"],
				"down":  ["╙", "╚", "╙", "║"],
				"left":  ["═", "═", "═", " "],
				"right": ["═", "═", "═", "═"]
			},
			charmap.left, charmap.right,
			["╶", " ", "╺", " "],
			["╴", "═", "╸", " "],
			'right');
			break;
	}
}

function modifyBoxLine(editBuilder: vscode.TextEditorEdit, position: vscode.Position, direction: 'up' | 'down' | 'left' | 'right', currentChar: string) {
	let newLine;
	function replaceChar(position: vscode.Position, newChar: string) {
		const range = new vscode.Range(position, position.translate(0, 1));  // Range for one character
		editBuilder.replace(range, newChar);
	}
	last = new vscode.Position(0, 0);

	function mapcase(dir: object, missing: object) {
		newLine = dir[currentChar as keyof object];

		if (!newLine) {
			replaceChar(position, missing[currentLineType as keyof object]);
			return;
		}

		if (newLine[currentLineType] == currentChar)
		{ newLine = dir[currentChar as keyof object][3]
		} else
		{ newLine = newLine[currentLineType]
		};

		replaceChar(position, newLine);
	}

	switch (direction) {
		case 'up':
			mapcase(charmap.down,  ["╵", "║", "╹", " "]);
			break;
		case 'down':
			mapcase(charmap.up,    ["╷", "║", "╻", " "]);
			break;
		case 'left':
			mapcase(charmap.right, ["╴", "═", "╸", " "]);
			break;
		case 'right':
			mapcase(charmap.left,  ["╶", "═", "╺", " "]);
			break;
	}
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
