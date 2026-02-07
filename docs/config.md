## Card options

| Name | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | **required** | Must be set to `custom:energy-distribution-card-ext` |
| `mode` | `energy \| power` | `energy` | Selects whether the card should display energy or power flows |
| `title` | `string` | | Shows a title at the top of the card |
| `use_hass_config` | `boolean` | `true` | Loads the entities configured for the HASS Energy Dashboard |
| `date_range` | `today \| yesterday \| this_week \| this_month \| this_quarter \| this_year \| now-7d \| now-30d \| now-12m \| custom \| from_date_picker` | `from_date_picker` if an `energy-date-selection` card is present in the dashboard;<br>`today` otherwise | The date-range to display (`energy` mode only) |
| `date_range_from` | `string` | | The start of the date-range to display, in `YYYY-MM-DD` format (if `date_range` is `custom`) |
| `date_range_to` | `string` | | The end of the date-range to display, in `YYYY-MM-DD` format (if `date_range` is `custom`) |
| `date_range_live` | `boolean` | `false` | Include the latest data from the entities in the display (`energy` mode only) |
| `date_range_display` | `do_not_show \| label \| dates \| both` | `do_not_show` | Display the selected date-range at the top of the card (`energy` mode only) |
| `appearance` | [`Appearance`](appearance.md) | | Appearance options section |
| `battery` | [`Battery`](battery.md) | | Battery options section |
| `gas` | [`Gas`](gas.md) | | Gas options section |
| `grid` | [`Grid`](grid.md) | | Grid options section |
| `home` | [`Home`](home.md) | | Home options section |
| `low-carbon` | [`Low-carbon`](low-carbon.md) | | Low-carbon options section |
| `solar` | [`Solar`](solar.md) | | Solar options section |
| `Devices` | [`Device[]`](devices.md) | | Device options section | 
