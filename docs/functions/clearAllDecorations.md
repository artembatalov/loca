> **clearAllDecorations**(`editor`): `void`

Defined in: [extension.ts:378](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L378)

Clears all LOC-related decorations from the editor.

This removes:
- inline "LOC: X" labels
- background highlight

Decorations are cleared by applying each decoration type with an
empty range array, which instructs VS Code to remove them.

## Parameters

### editor

`TextEditor`

Editor from which all decorations should be removed.

## Returns

`void`
