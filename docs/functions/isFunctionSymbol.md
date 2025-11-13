> **isFunctionSymbol**(`symbol`): `boolean`

Defined in: [extension.ts:329](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L329)

Checks whether a DocumentSymbol represents a function-like element.

Accepted symbol kinds:
- Function      (standalone functions)
- Method        (class or object methods)
- Constructor   (class constructors)

## Parameters

### symbol

`DocumentSymbol`

Symbol to check

## Returns

`boolean`

True if symbol is a function, method, or constructor, false otherwise.
