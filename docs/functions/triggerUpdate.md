> **triggerUpdate**(`editor`): `void`

Defined in: [extension.ts:129](https://github.com/artembatalov/loca/blob/ff5deaee819e193cc0d2c8c705e54e5b4bacf52f/src/extension.ts#L129)

Schedules a deferred LOC update (debounce).
If the user keeps typing, the previously scheduled update is canceled.
A new timer is started, and the actual refresh runs only after the user
pauses for ~250 ms.

## Parameters

### editor

`TextEditor`

Editor where backlight need to be updated

## Returns

`void`
