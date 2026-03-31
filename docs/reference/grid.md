## Grid configuration

In the below options, `import` is energy drawn from the grid; `export` is energy returned to the grid.

In `power` mode, the entities must return positive values for importing and negative values for exporting.

| Name              | Type                               | Default | Description                                              |
|-------------------|------------------------------------|---------|----------------------------------------------------------|
| `import_entities` | [Entities](entities.md)            |         | Import entities settings section<br>(`energy` mode only) |
| `export_entities` | [Entities](entities.md)            |         | Export entities settings section<br>(`energy` mode only) |
| `power_entities`  | [Entities](entities.md)            |         | Power entities settings section<br>(`power` mode only)   |
| `overrides`       | [Overrides](overrides.md)          |         | Overrides settings section                               |
| `colours`         | [Colours](#colours)                |         | Colours settings section                                 |
| `secondary_info`  | [SecondaryInfo](secondary-info.md) |         | Secondary-info settings section                          |
| `power_outage`    | [PowerOutage](#power-outage)       |         | Power-outage settings section                            |

### Colours

| Name                  | Type                                                    | Default   | Description                                                                                                                                                                                                                   |
|-----------------------|---------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `flow_import_mode`    | `default \| custom`                                     | `default` | If `default` the flow will use the HASS colour                                                                                                                                                                                |
| `flow_import_colour`  | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `flow_export_mode`    | `default \| custom`                                     | `default` | If `default` the flow will use the HASS colour                                                                                                                                                                                |
| `flow_export_colour`  | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `circle_mode`         | `dynamic \| auto \| import \| export \| none \| custom` | `import`  | If `dynamic` the circle will display the sources of energy/power exported to the battery and the destinations of energy/power imported from the battery; if `auto` the circle will take the colour of the larger of the flows |
| `circle_colour`       | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `icon_mode`           | `auto \| import \| export \| none \| custom`            | `none`    | If `auto` the icon will take the colour of the larger of the flows                                                                                                                                                            |
| `icon_colour`         | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `value_import_mode`   | `none \| flow \| custom`                                | `flow`    | If `flow` the value will take the colour of the flow                                                                                                                                                                          |
| `value_import_colour` | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `value_export_mode`   | `none \| flow \| custom`                                | `flow`    | If `flow` the value will take the colour of the flow                                                                                                                                                                          |
| `value_export_colour` | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |
| `secondary_mode`      | `auto \| import \| export \| none \| custom`            | `none`    | If `auto` the secondary value will take the colour of the larger of the flows                                                                                                                                                 |
| `secondary_colour`    | `number[]`                                              |           | An RGB triplet of the `custom` colour to use                                                                                                                                                                                  |

### Power Outage

If configured, the Grid circle will display a message while a power-outage is occurring.

| Name          | Type     | Default | Description                                                                      |
|---------------|----------|---------|----------------------------------------------------------------------------------|
| `entity_id`   | `string` |         | An entity whose state can be checked to determine if a power-outage is occurring |
| `alert_state` | `string` |         | The state of the entity which indicates a power-outage                           |
| `alert_icon`  | `string` |         | If set, this icon will be displayed in the circle in place of the usual icon     |
