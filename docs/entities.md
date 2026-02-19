## Entities configuration

Any number of entities may be selected, and their values will be summed for display. If [use_hass_config](config.md#card-options) is `true`, the Energy Dashboard's entities will be loaded automatically and added to the totals. Adding entities here will not override these.

If `mode` is `energy`, the entities must be of `device_class` `energy` and `state_class` `total` or `total_increasing`.

> An entity with `state_class` `total` will display unpredictable results if its value resets periodically (for example, daily), as it is not possible for HASS to distinguish between a reset and a normal decrease in value.

If `mode` is `power`, the entities must be of `device_class` `power` and `state_class` `measurement`.

| Name         | Type       | Default | Description            |
|--------------|------------|---------|------------------------|
| `entity_ids` | `string[]` |         | An array of entity IDs |
