import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { before, after } from 'mocha';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it

suite('FiveM Project Creator Extension', () => {
	const testProjectPath = path.join(__dirname, 'test-project');
	const testProjectName = 'test-project';

	// เตรียมข้อมูลก่อน test ทั้งหมด
	suiteSetup(async () => {
		console.log('Starting test suite...');
	});

	// cleanup หลัง test ทั้งหมด
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
			// จำลองการเลือกของผู้ใช้
			const userSelected = {
				have_gui: false,
				have_sql: false,
				project_name: testProjectName,
				project_path: testProjectPath
			};

			// เรียกใช้คำสั่งสร้างโปรเจค
			await vscode.commands.executeCommand('fivemprojectcreate.createProject');

			// ตรวจสอบว่าไฟล์และโฟลเดอร์ถูกสร้างหรือไม่
			const expectedFiles = [
				'fxmanifest.lua',
				'config.lua',
				'client/rcn.client.lua',
				'server/rcn.server.lua'
			];

			for (const file of expectedFiles) {
				const filePath = path.join(testProjectPath, file);
				try {
					const stats = await fs.stat(filePath);
					assert.ok(stats.isFile(), `${file} should be created`);
				} catch (error) {
					assert.fail(`Failed to create ${file}`);
				}
			}
		});

		test('Should create GUI files when have_gui is true', async () => {
			const guiFiles = [
				'html/index.html',
				'html/css/app.css',
				'html/js/app.js',
				'html/js/jquery.js'
			];

			for (const file of guiFiles) {
				const filePath = path.join(testProjectPath, file);
				try {
					const stats = await fs.stat(filePath);
					assert.ok(stats.isFile(), `${file} should be created when GUI is enabled`);
				} catch (error) {
					assert.fail(`Failed to create GUI file ${file}`);
				}
			}
		});

		test('Should include SQL setup when have_sql is true', async () => {
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
	});

	suite('Error Handling', () => {
		test('Should handle missing project name', async () => {
			// จำลองการไม่ใส่ชื่อโปรเจค
			const showInputStub = sinon.stub(vscode.window, 'showInputBox').resolves(undefined);
			const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
			
			await vscode.commands.executeCommand('fivemprojectcreate.createProject');
			
			assert.ok(showErrorStub.calledWith('Project name is required'), 'Should show error for missing project name');
			
			showInputStub.restore();
			showErrorStub.restore();
		});
	});
});
