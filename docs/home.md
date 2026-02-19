## Home configuration

| Name             | Type                               | Default | Description                     |
|------------------|------------------------------------|---------|---------------------------------|
| `overrides`      | [Overrides](overrides.md)          |         | Overrides settings section      |
| `colours`        | [Colours](#colours)                |         | Colours settings section        |
| `secondary_info` | [SecondaryInfo](secondary-info.md) |         | Secondary-info settings section |
| `options`        | [Options](#options)                |         | Home settings section           |

### Colours

| Name                  | Type                                                                                        | Default   | Description                                                                                                                                                                      |
|-----------------------|---------------------------------------------------------------------------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `circle_mode`         | `dynamic \| none \| auto \| solar \| high_carbon \| low_carbon \| battery \| gas \| custom` | `dynamic` | If `dynamic` the circle will display the sources of energy/power being consumed by the house; if `auto` the circle will take the colour of the largest of the flows to the house |
| `circle_colour`       | `number[]`                                                                                  |           | An RGB triad of the `custom` colour to use                                                                                                                                       |
| `icon_mode`           | `none \| auto \| solar \| high_carbon \| low_carbon \| battery \| gas \| custom`            | `none`    | If `auto` the icon will take the colour of the largest of the flows to the house                                                                                                 |
| `icon_colour`         | `number[]`                                                                                  |           | An RGB triad of the `custom` colour to use                                                                                                                                       |
| `value_export_mode`   | `none \| auto \| solar \| high_carbon \| low_carbon \| battery \| gas \| custom`            | `none`    | If `auto` the icon will take the colour of the largest of the flows to the house                                                                                                 |
| `value_export_colour` | `number[]`                                                                                  |           | An RGB triad of the `custom` colour to use                                                                                                                                       |
| `secondary_mode`      | `none \| auto \| solar \| high_carbon \| low_carbon \| battery \| gas \| custom`            | `none`    | If `auto` the secondary value will take the colour of the largest of the flows to the house                                                                                      |
| `secondary_colour`    | `number[]`                                                                                  |           | An RGB triad of the `custom` colour to use                                                                                                                                       |

### Options

| Name                    | Type                                                          | Default       | Description                                                                                                                                                                                |
|-------------------------|---------------------------------------------------------------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `gas_sources`           | `do_not_show \| add_to_total \| show_separately \| automatic` | `do_not_show` | If enabled, the total amount of gas energy/power being consumed by the house will be displayed in addition to the electric value                                                           |
| `gas_sources_threshold` | `number`                                                      |               | If `gas_sources` is `automatic`, the gas value will be added to the electric total if it is less than this percentage of the overall total energy/power; and as a separate value otherwise |
