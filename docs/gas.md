## Gas configuration

| Name | Type | Default | Description |
|---|---|---|---|
| `import_entities` | [Entities](entities.md) | | Entities settings section<br>(`energy` mode only) |
| `power_entities` | [Entities](entities.md) | | Entities settings section<br>(`power` mode only) |
| `overrides` | [Overrides](overrides.md) | | Overrides settings section |
| `colours` | [Colours](#colours) | | Colours settings section |
| `secondary_info` | [SecondaryInfo](secondary-info.md) | | Secondary-info settings section |

### Colours

| Name | Type | Default | Description |
|---|---|---|---|
| `flow_import_mode` | `default \| custom` | `default` | If `default` the flow-colour will use the HASS setting |
| `flow_import_colour` | `number[]` | | An RGB triad of the `custom` colour to use |
| `circle_mode` | `none \| flow \| custom` | `flow` | If `flow` the circle will take the colour of the flow |
| `circle_colour` | `number[]` | | An RGB triad of the `custom` colour to use |
| `icon_mode` | `none \| flow \| custom` | `none` | If `flow` the icon will take the colour of the flow |
| `icon_colour` | `number[]` | | An RGB triad of the `custom` colour to use |
| `value_import_mode` | `none \| flow \| custom` | `none` | If `flow` the value will take the colour of the flow |
| `value_import_colour` | `number[]` | | An RGB triad of the `custom` colour to use |
| `secondary_mode` | `none \| flow \| custom` | `none` | If `flow` the secondary value will take the colour of the flow |
| `secondary_colour` | `number[]` | | An RGB triad of the `custom` colour to use |
