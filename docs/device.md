## Device configuration

`Import` is energy produced by the device; `export` is energy consumed by the device.

In `power` mode, the entities must return positive values for production and negative values for consumption.

| Name                 | Type                               | Default       | Description                                                                                 |
|----------------------|------------------------------------|---------------|---------------------------------------------------------------------------------------------|
| `name`               | `string`                           | `New Device`  | The name for the device                                                                     |
| `icon`               | `string`                           | `mdi:devices` | The icon for the device                                                                     |
| `energy_type`        | `electric \| gas`                  | `electric`    | The type of the device                                                                      |
| `energy_direction`   | `consumer \| producer \| both`     | `consumer`    | Whether the device acts as a consumer of energy/power, a producer or both                   |
| `subtract_from_home` | `boolean`                          | `true`        | If `true` the consumption value will be subtracted from the totals shown in the Home circle |
| `import_entities`    | [Entities](entities.md)            |               | Entities settings section<br>(`energy` mode only)                                           |
| `export_entities`    | [Entities](entities.md)            |               | Entities settings section<br>(`energy` mode only)                                           |
| `power_entities`     | [Entities](entities.md)            |               | Entities settings section<br>(`power` mode only)                                            |
| `colours`            | [Colours](#colours)                |               | Colours settings section                                                                    |
| `secondary_info`     | [SecondaryInfo](secondary-info.md) |               | Secondary-info settings section                                                             |

### Colours

| Name                  | Type                                         | Default | Description                                                                   |
|-----------------------|----------------------------------------------|---------|-------------------------------------------------------------------------------|
| `flow_import_colour`  | `number[]`                                   |         | An RGB triad of the colour to use                                             |
| `flow_export_colour`  | `number[]`                                   |         | An RGB triad of the colour to use                                             |
| `circle_mode`         | `auto \| import \| export \| none \| custom` | `auto`  | If `auto` the circle will take the colour of the larger of the flows          |
| `circle_colour`       | `number[]`                                   |         | An RGB triad of the `custom` colour to use                                    |
| `icon_mode`           | `auto \| import \| export \| none \| custom` | `none`  | If `auto` the icon will take the colour of the larger of the flows            |
| `icon_colour`         | `number[]`                                   |         | An RGB triad of the `custom` colour to use                                    |
| `value_import_mode`   | `none \| flow \| custom`                     | `flow`  | If `flow` the value will take the colour of the flow                          |
| `value_import_colour` | `number[]`                                   |         | An RGB triad of the `custom` colour to use                                    |
| `value_export_mode`   | `none \| flow \| custom`                     | `flow`  | If `flow` the value will take the colour of the flow                          |
| `value_export_colour` | `number[]`                                   |         | An RGB triad of the `custom` colour to use                                    |
| `secondary_mode`      | `auto \| import \| export \| none \| custom` | `none`  | If `auto` the secondary value will take the colour of the larger of the flows |
| `secondary_colour`    | `number[]`                                   |         | An RGB triad of the `custom` colour to use                                    |
