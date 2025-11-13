> **getLocCategory**(`loc`): `LocCategory`

Defined in: [extension.ts:343](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L343)

Determines the LOC category for a function based on its size.

## Parameters

### loc

`number`

Number of code inside the function body.

## Returns

`LocCategory`

The corresponding LOC category ("green", "orange", or "red").
