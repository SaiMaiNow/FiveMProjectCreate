import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Command: Hello World', async () => {
		// Attempt to execute the command
		await vscode.commands.executeCommand('fivemprojectcreate.helloWorld');
		
		// Since the command shows an information message, we can't directly test the result
		// But we can at least verify the command exists
		const commands = await vscode.commands.getCommands();
		assert.ok(commands.includes('fivemprojectcreate.helloWorld'));
	});
});
