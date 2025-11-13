> **refreshDecorations**(`editor`): `Promise`\<`void`\>

Defined in: [extension.ts:152](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L152)

Updates all LOC-related decorations in the editor.

Steps:
 1. Analyzes the document and retrieves LOC metrics for each function.
 2. Clears decorations if the document contains no functions.
 3. Groups function ranges by LOC category (green, orange, red).
 4. Builds inline "LOC: X" labels placed next to each function signature.
 5. Applies background highlights and inline decorations to the editor.

Red-category functions receive an additional warning message,
which can be removed by disabling the corresponding conditional block.

## Parameters

### editor

`TextEditor`

The editor where decorations should be refreshed.

## Returns

`Promise`\<`void`\>
