import * as vscode from 'vscode';
import { SourceMapService } from '../services/SourceMapService';

export class FilteredLogDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private sourceMapService: SourceMapService) { }

    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {

        // Check if there's a mapping for this document
        if (!this.sourceMapService.hasMapping(document.uri)) {
            return undefined;
        }

        // Retrieve original location
        const location = this.sourceMapService.getOriginalLocation(document.uri, position.line);
        if (location) {
            // Set pending navigation so the destination editor knows to flash the line
            this.sourceMapService.setPendingNavigation(location.uri, location.range.start.line);

            // Return a DefinitionLink to allow customizing the origin selection range
            // enabling the entire line to be a clickable link
            const lineRange = document.lineAt(position.line).range;

            return [{
                originSelectionRange: lineRange,
                targetUri: location.uri,
                targetRange: location.range,
                targetSelectionRange: location.range
            }];
        }

        return undefined;
    }
}
