'use strict';

import * as vscode from 'vscode';
import { ASMHoverProvider } from "./hover";
import { ASMFormatter, ASMTypingFormatter, ASMDocumentFormatter, ASMDocumentRangeFormatter } from "./formatter";
import { ASMSymbolDocumenter } from "./symbolDocumenter";
import { ASMCompletionProposer } from './completionProposer';
import { ASMDefinitionProvider } from './definitionProvider';
import { ASMDocumentSymbolProvider } from './documentSymbolProvider';
import { ASMWorkspaceSymbolProvider } from './workspaceSymbolProvider';
import { ASMDocumentLinkProvider } from './documentLinkProvider';

import { Z80RenameProvider } from './renameProvider';
import { SymbolProcessor } from './symbolProcessor';

let changeConfigSubscription: vscode.Disposable | undefined;
let symbolProcessor: SymbolProcessor | undefined;

export function activate(context: vscode.ExtensionContext) {
	subscribeProviders(context);

	changeConfigSubscription = vscode.workspace.onDidChangeConfiguration(event => {
		subscribeProviders(context, event)
	});
}

function subscribeProviders(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
	const extensionSettings = vscode.workspace.getConfiguration("rgbdsz80")
	const languageSelector: vscode.DocumentFilter = { language: "gbz80", scheme: "file" };

	if (symbolProcessor)
		symbolProcessor.destroy()

	symbolProcessor = new SymbolProcessor(extensionSettings)

	let provider: vscode.Disposable | undefined;
	while ((provider = context.subscriptions.pop()) != null) {
		provider.dispose()
	}

  const symbolDocumenter = new ASMSymbolDocumenter();
  const formatter = new ASMFormatter();

	context.subscriptions.push(vscode.languages.registerHoverProvider(languageSelector, new ASMHoverProvider(symbolDocumenter)));
	context.subscriptions.push(vscode.languages.registerOnTypeFormattingEditProvider(languageSelector, new ASMTypingFormatter(formatter), " ", ",", ";", ":"));
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(languageSelector, new ASMDocumentFormatter(formatter)));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(languageSelector, new ASMDocumentRangeFormatter(formatter)));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(languageSelector, new ASMCompletionProposer(symbolDocumenter, formatter), `"`));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(languageSelector, new ASMDefinitionProvider(symbolDocumenter)));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(languageSelector, new ASMDocumentSymbolProvider(symbolDocumenter)));
  context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new ASMWorkspaceSymbolProvider(symbolDocumenter)));
	context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(languageSelector, new ASMDocumentLinkProvider(symbolDocumenter)));

	context.subscriptions.push(vscode.languages.registerRenameProvider(languageSelector, new Z80RenameProvider(symbolProcessor)));
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (symbolProcessor) {
		symbolProcessor.destroy();
		symbolProcessor = undefined;
	}

	if (changeConfigSubscription) {
		changeConfigSubscription.dispose();
		changeConfigSubscription = undefined;
	}
}