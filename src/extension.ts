// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const userSelected = {
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

function createProject(userSelected: any) {
	
}

// This method is called when your extension is deactivated
export function deactivate() {}