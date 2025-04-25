// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import fs from 'fs/promises';
import path from 'path';

interface UserSelected {
	have_gui: boolean;
	have_sql: boolean;
	project_name: string;
	project_path: string;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const userSelected: UserSelected = {
		have_gui: false,
		have_sql: false,
		project_name: '',
		project_path: '',
	};

	const command = vscode.commands.registerCommand('fivemprojectcreate.createProject', () => {
		vscode.window.showInputBox({
			title: 'Enter Project Name',
			placeHolder: 'Please enter the project name you want to create',
		}).then(projectName => {
			if (!projectName) {
				vscode.window.showErrorMessage('Project name is required');
				return;
			}

			userSelected.project_name = projectName;

			const options = {
				title: 'Select Project Have a GUI or Not',
				placeHolder: 'Please select the project details you want to create',
				items: [
					{
						label: 'Have a GUI',
						value: 'have_gui',
						description: 'Create a FiveM project with a GUI'
					},
					{
						label: 'No GUI',
						value: 'no_gui',
						description: 'Create a FiveM project without not a GUI'
					}
				]
			};

			vscode.window.showQuickPick(options.items, {
				title: options.title,
				placeHolder: options.placeHolder
			}).then(selection => {
				if (!selection) {
					userSelected.have_gui = false;
				} else if (selection.value === 'have_gui') {
					userSelected.have_gui = true;
				} else {
					userSelected.have_gui = false;
				}

				const options = {
					title: 'Select Project Have a SQL or Not',
					placeHolder: 'Please select the project details you want to create',
					items: [
						{
							label: 'Have a SQL',
							value: 'have_sql',
							description: 'Create a FiveM project with a SQL'
						},
						{
							label: 'No SQL',
							value: 'no_sql',
							description: 'Create a FiveM project without not a SQL'
						}
					]
				};

				vscode.window.showQuickPick(options.items, {
					title: options.title,
					placeHolder: options.placeHolder
				}).then(selection => {
					if (!selection) {
						userSelected.have_sql = false;
					} else if (selection.value === 'have_sql') {
						userSelected.have_sql = true;
					} else {
						userSelected.have_sql = false;
					}

					vscode.window.showInputBox({
						title: 'Enter Project Path',
						placeHolder: 'Please enter the project path you want to create',
					}).then(projectPath => {
						if (!projectPath) {
							userSelected.project_path = '.';
						} else {
							userSelected.project_path = projectPath;
						}

						createProject(userSelected);
					});
				});
			});
		});
	});

	context.subscriptions.push(command);
}

async function createProject(userSelected: UserSelected) {

	try {
		const projectPath: string = path.join(userSelected.project_path, userSelected.project_name);

		try {
	 		const stats = await fs.stat(projectPath);
			if (stats.isDirectory()) {
				const result = await vscode.window.showWarningMessage(
                    `Folder ${userSelected.project_name} already exists, do you want to overwrite it?`,
                    'Overwrite',
                    'Cancel'
                );
                
                if (result !== 'Overwrite') {
                    vscode.window.showInformationMessage('Cancel create project');
                    return;
                }
			}
		} catch (error: any) {
			if (error.code !== 'ENOENT') {
                throw error;
            }
		}

		await fs.mkdir(projectPath, { recursive: true });
		await fs.mkdir(path.join(projectPath, 'server'), { recursive: true });
		await fs.mkdir(path.join(projectPath, 'client'), { recursive: true });

		let fxmanifestContent = [
            "fx_version 'cerulean'",
            "game 'gta5'",
            "author 'RCN'",
            `description '${userSelected.project_name} made by RCN'`,
            "",
            "lua54 'yes'",
            "",
            "client_scripts {",
            "    'client/rcn.client.lua',",
            "}",
            "",
            "server_scripts {",
            "    'server/rcn.server.lua',",
            "}",
            "",
            "dependencies {",
            "    'es_extended',",
            "    'rcn_core',",
            "}"
        ].join('\n');

		let configContent = [
            "Config = Config or {}"
        ].join('\n');

		let clientContent = [
            "local ESX = exports['es_extended']:getSharedObject()"
        ].join('\n');

		let serverContent = [
            "local ESX = exports['es_extended']:getSharedObject()"
        ].join('\n');

		if (userSelected.have_gui) {
			await fs.mkdir(path.join(projectPath, 'html'), { recursive: true });
			await fs.mkdir(path.join(projectPath, 'html/css'), { recursive: true });
			await fs.mkdir(path.join(projectPath, 'html/js'), { recursive: true });

			await fs.writeFile(path.join(projectPath, 'html/index.html'), '');
			await fs.writeFile(path.join(projectPath, 'html/css/app.css'), '');
			await fs.writeFile(path.join(projectPath, 'html/js/app.js'), '');

			const jqueryUrl = 'https://code.jquery.com/jquery-latest.min.js';
			const response = await fetch(jqueryUrl);
			const jqueryContent = await response.text();
			await fs.writeFile(path.join(projectPath, 'html/js/jquery.js'), jqueryContent);

			clientContent += [
                "",
                "local isOpenGui = false",
                "",
                "function ToggleGui(status)",
                "    isOpenGui = status",
                "    SetNuiFocus(status, status)",
                "    SendNUIMessage({",
                "        action = status and 'openGui' or 'closeGui'",
                "    })",
                "end"
            ].join('\n');

			fxmanifestContent += [
                "",
                "ui_page 'html/index.html'",
                "",
                "files {",
                "    'html/**',",
                "}"
            ].join('\n');
		}

		if (userSelected.have_sql) {
			serverContent += [
                "",
                "MySQL.ready(function()",
                "    print('MySQL is ready')",
                "end)"
            ].join('\n');

			fxmanifestContent += [
                "",
                "server_script '@mysql-async/lib/MySQL.lua'"
            ].join('\n');
		}

		await fs.writeFile(path.join(projectPath, 'fxmanifest.lua'), fxmanifestContent);
		await fs.writeFile(path.join(projectPath, 'config.lua'), configContent);
		await fs.writeFile(path.join(projectPath, 'client/rcn.client.lua'), clientContent);
		await fs.writeFile(path.join(projectPath, 'server/rcn.server.lua'), serverContent);

		vscode.window.showInformationMessage('Project created successfully');
	} catch (error) {
		vscode.window.showErrorMessage('Failed to create project : ' + error);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Extension deactivated');
}