import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { before, after } from 'mocha';
import * as sinon from 'sinon';

interface ExtendedQuickPickItem extends vscode.QuickPickItem {
	value: string;
}

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it

suite('FiveM Project Creator Extension', () => {
	const testProjectPath = path.join(__dirname, 'test-project');
	const testProjectName = 'test-project';
	let sandbox: sinon.SinonSandbox;

	suiteSetup(async () => {
		console.log('Starting test suite...');
		
		// รอให้ extension activate
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// ใช้ extension ID แบบเต็ม: publisher.name
		const extensionId = 'rcn.fivemprojectcreate';
		console.log(`Looking for extension: ${extensionId}`);
		
		const ext = vscode.extensions.getExtension(extensionId);
		if (!ext) {
			// แสดงรายการ extensions ทั้งหมดเพื่อ debug
			const allExtensions = vscode.extensions.all.map(e => e.id);
			console.log('Available extensions:', allExtensions);
			
			// ลอง activate extension ด้วยการเรียก command
			await vscode.commands.executeCommand('fivemprojectcreate.createProject');
			
			// ลองหา extension อีกครั้ง
			const retryExt = vscode.extensions.getExtension(extensionId);
			if (!retryExt) {
				throw new Error(`Extension not found: ${extensionId}. Make sure the extension ID matches package.json`);
			}
			await retryExt.activate();
		} else {
			await ext.activate();
		}
	});

	setup(() => {
		sandbox = sinon.createSandbox();
	});

	teardown(() => {
		sandbox.restore();
	});

	suiteTeardown(async () => {
		try {
			await fs.rm(testProjectPath, { recursive: true, force: true });
		} catch (error) {
			console.error('Error cleaning up:', error);
		}
	});

	suite('Command Registration', () => {
		test('createProject command should be registered', async () => {
			const commands = await vscode.commands.getCommands();
			assert.ok(commands.includes('fivemprojectcreate.createProject'));
		});
	});

	suite('Project Creation', () => {
		test('Should create basic project structure', async () => {

			// Mock user input
			const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
			const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');

			// Setup return values
			showInputBoxStub.onFirstCall().resolves(testProjectName); // Project name
			showInputBoxStub.onSecondCall().resolves(testProjectPath); // Project path
			showQuickPickStub.resolves({ label: 'No GUI', value: 'no_gui' } as ExtendedQuickPickItem); // GUI option

			try {
				// Execute command
				await vscode.commands.executeCommand('fivemprojectcreate.createProject');

				// Wait for file creation
				await new Promise(resolve => setTimeout(resolve, 2000));

				// Check files
				const expectedFiles = [
					'fxmanifest.lua',
					'config.lua',
					'client/rcn.client.lua',
					'server/rcn.server.lua'
				];

				for (const file of expectedFiles) {
					const filePath = path.join(testProjectPath, file);
					const exists = await fs.access(filePath).then(() => true).catch(() => false);
					assert.ok(exists, `${file} should be created`);
				}
			} finally {
				showInputBoxStub.restore();
				showQuickPickStub.restore();
			}
		});

		test('Should create GUI files when have_gui is true', async () => {
			// Mock user input for GUI project
			const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
			const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');

			showInputBoxStub.onFirstCall().resolves(testProjectName + '-gui');
			showInputBoxStub.onSecondCall().resolves(testProjectPath + '-gui');
			showQuickPickStub.resolves({ label: 'Have a GUI', value: 'have_gui' } as ExtendedQuickPickItem);

			try {
				await vscode.commands.executeCommand('fivemprojectcreate.createProject');
				await new Promise(resolve => setTimeout(resolve, 1000));

				const guiFiles = [
					'html/index.html',
					'html/css/app.css',
					'html/js/app.js',
					'html/js/jquery.js'
				];

				for (const file of guiFiles) {
					const filePath = path.join(testProjectPath + '-gui', file);
					const exists = await fs.access(filePath).then(() => true).catch(() => false);
					assert.ok(exists, `${file} should be created when GUI is enabled`);
				}
			} finally {
				showInputBoxStub.restore();
				showQuickPickStub.restore();
			}
		});

		test('Should include SQL setup when have_sql is true', async function() {
			// Mock SQL selection
			const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
			showQuickPickStub.onSecondCall().resolves({ label: 'Have a SQL', value: 'have_sql' } as ExtendedQuickPickItem);
			
			const fxmanifestPath = path.join(testProjectPath, 'fxmanifest.lua');
			const serverPath = path.join(testProjectPath, 'server/rcn.server.lua');

			try {
				const fxmanifest = await fs.readFile(fxmanifestPath, 'utf-8');
				const serverFile = await fs.readFile(serverPath, 'utf-8');

				assert.ok(
					fxmanifest.includes("@mysql-async/lib/MySQL.lua"),
					'fxmanifest should include MySQL when SQL is enabled'
				);
				assert.ok(
					serverFile.includes("MySQL.ready"),
					'Server file should include MySQL setup when SQL is enabled'
				);
			} catch (error) {
				assert.fail('Failed to verify SQL setup');
			}
		});

		test('Should handle existing project folder', async function() {
			// Mock user input
			const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
			const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
			const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage');

			const existingProjectPath = path.join(testProjectPath, 'existing-project');
			await fs.mkdir(existingProjectPath, { recursive: true });

			try {
				// Setup return values
				showInputBoxStub.onFirstCall().resolves('existing-project'); // Project name
				showInputBoxStub.onSecondCall().resolves(testProjectPath); // Project path
				showQuickPickStub.resolves({ label: 'No GUI', value: 'no_gui' } as ExtendedQuickPickItem);
				
				showWarningStub.returns(Promise.resolve({ title: 'Overwrite', isCloseAffordance: true } as vscode.MessageItem));
				
				await vscode.commands.executeCommand('fivemprojectcreate.createProject');
				
				assert.ok(
					showWarningStub.calledWith(
						sinon.match.string,
						sinon.match.array.deepEquals(['Overwrite', 'Cancel'])
					),
					'Should show warning for existing folder'
				);

				showWarningStub.resolves({ title: 'Overwrite', isCloseAffordance: true } as vscode.MessageItem);
				
				await vscode.commands.executeCommand('fivemprojectcreate.createProject');
				
				const expectedFiles = [
					'fxmanifest.lua',
					'config.lua',
					'client/rcn.client.lua',
					'server/rcn.server.lua'
				];

				for (const file of expectedFiles) {
					const filePath = path.join(existingProjectPath, file);
					const exists = await fs.access(filePath).then(() => true).catch(() => false);
					assert.ok(exists, `${file} should be created after overwrite`);
				}

			} finally {
				showInputBoxStub.restore();
				showQuickPickStub.restore();
				showWarningStub.restore();

				await fs.rm(existingProjectPath, { recursive: true, force: true });
			}
		});

		test('Should handle folder creation errors', async function() {
			// ใช้ proxyquire แทนการ mock โดยตรง
			const proxyquire = require('proxyquire').noCallThru();
			const fsStub = {
				promises: {
					mkdir: sinon.stub().rejects(new Error('Permission denied'))
				}
			};
			
			const extension = proxyquire('../extension', {
				'fs': fsStub
			});
			
			// Mock user input
			const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
			const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
			const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
			
			showInputBoxStub.onFirstCall().resolves('error-test');
			showInputBoxStub.onSecondCall().resolves(testProjectPath);
			showQuickPickStub.resolves({ label: 'No GUI', value: 'no_gui' } as ExtendedQuickPickItem);

			await vscode.commands.executeCommand('fivemprojectcreate.createProject');

			assert.ok(
				showErrorStub.calledWith('Failed to create project : Error: Permission denied'),
				'Should show error message for folder creation failure'
			);
		});
	});

	suite('Error Handling', () => {
		test('Should handle missing project name', async () => {
			const showInputStub = sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
			const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
			
			await vscode.commands.executeCommand('fivemprojectcreate.createProject');
			
			assert.ok(showErrorStub.calledWith('Project name is required'), 'Should show error for missing project name');
			
			showInputStub.restore();
			showErrorStub.restore();
		});
	});
});
