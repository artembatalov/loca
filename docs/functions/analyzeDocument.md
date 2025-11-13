> **analyzeDocument**(`document`): `Promise`\<`FunctionMetric`[]\>

Defined in: [extension.ts:207](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L207)

Analyzes a document and extracts LOC metrics for all function-like symbols.

Process:
 1. Requests the document's symbol tree via VS Code's DocumentSymbolProvider.
 2. Performs a DFS traversal of the symbol tree.
 3. Filters out all symbols that are not functions, methods, or constructors.
 4. Computes LOC for each function using `countLoc`.
 5. Stores metrics in a Map to avoid duplicates.
 6. Returns a flat array of all collected function metrics.

## Parameters

### document

`TextDocument`

Document to analyze.

## Returns

`Promise`\<`FunctionMetric`[]\>

List of LOC metrics for all discovered functions.
