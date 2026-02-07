## Battery configuration
`Import` is energy discharged from the battery; `export` is energy used to charge the battery.

In `power` mode, the entities must return positive values for discharging and negative values for charging.

| Name | Type | Default | Description |
|---|---|---|---|
| `import_entities` | [Entities](entities.md) | | Entities settings section (`energy` mode only) |
| `export_entities` | [Entities](entities.md) | | Entities settings section (`energy` mode only) |
| `power_entities` | [Entities](entities.md) | | Entities settings section (`power` mode only) |
| `overrides` | [Overrides](overrides.md) | | Overrides settings section |
| `colours` | [Colours](#colours) | | Colours settings section |
| `secondary_info` | [SecondaryInfo](secondary-info.md) | | Secondary-info settings section<br>If the selected entity is a state-of-charge, the icon for the battery circle will, if not [overridden](overrides.md), reflect the charge level of the battery (`power` mode only) |

### Colours
| Name | Type | Default | Description |
|---|---|---|---|
| `flow_import_mode` | `default \| custom` | `default` | If `default` the flow-colour will use the HASS setting; otherwise you can select your own colour using the `flow_import_colour` property |
| `flow_import_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `flow_export_mode` | `default \| custom` | `default` | If `default` the flow-colour will use the HASS setting; otherwise you can select your own colour using the `flow_import_colour` property |
| `flow_export_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `circle_mode` | `dynamic \| auto \| import \| export \| none \| custom` | `export` | If `dynamic` the circle will display the sources of energy/power exported to the battery and the destinations of energy/power imported from the battery; if `auto` the circle will take the colour of the larger of the flows |
| `circle_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `icon_mode` | `auto \| import \| export \| none \| custom` | `none` | If `auto` the icon will take the colour of the larger of the flows |
| `icon_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `value_import_mode` | `none \| flow \| custom` | `flow` | If `flow` the value will take the colour of the flow |
| `value_import_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `value_export_mode` | `none \| flow \| custom` | `flow` | If `flow` the value will take the colour of the flow |
| `value_export_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
| `secondary_mode` | `auto \| import \| export \| none \| custom` | `none` | If `auto` the secondary value will take the colour of the larger of the flows |
| `icon_colour` | `number[]` | | An RGB triad of the colour to use (`custom` mode only) |
