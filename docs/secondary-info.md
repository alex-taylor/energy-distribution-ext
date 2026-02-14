## Secondary-info configuration

If `mode` is `energy`, the entity must be of `state_class` `total` or `total_increasing`.

> An entity with `state_class` `total` will display unpredictable results if its value resets periodically (for example, daily), as it is not possible for HASS to distinguish between a reset and a normal decrease in value.

If `mode` is `power`, the entity must be of `state_class` `measurement`.

| Name | Type | Default | Description |
|---|---|---|---|
| `entity_id` | `string` | | The entity to display |
| `icon` | `string` | | An icon to be displayed next to the entity's value |
| `unit_position` | `after_space \| before_space \| after \| before \| hidden` | `after_space` | The position of the units relative to the value, and whether to separate the units and value with a space |
| `display_precision` | `number` | | The number of decimal places to show; if not set, the entity's settings will be used |
