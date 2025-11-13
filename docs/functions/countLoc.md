> **countLoc**(`document`, `symbol`): `number`

Defined in: [extension.ts:267](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L267)

Counts the number of meaningful lines of code (LOC) inside a function.

Steps:
 1. Determines the line where the function signature ends.
 2. Iterates through all lines in the function body.
 3. Ignores empty lines and comment lines using `isIgnorableLine`.
 4. Returns the total number of non-ignored lines.

Signature lines are never counted, even if the signature spans multiple lines.

## Parameters

### document

`TextDocument`

Document containing the function.

### symbol

`DocumentSymbol`

Symbol representing the function whose LOC is being measured.

## Returns

`number`

Number of meaningful LOC inside the function.
