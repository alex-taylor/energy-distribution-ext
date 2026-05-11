
# Change Log

## [1.0.0] - 2026-03-31

First release.


## [1.0.1] - 2026-04-03

Added support for per-dashboard Energy Collection configurations in HASS.


## [1.0.2] - 2026-04-03

Added null-check in an attempt to diagnose an issue.


## [1.0.3] - 2026-04-04

BUGFIX: Filter out empty strings when setting up entities.


## [1.0.4] - 2026-04-05

BUGFIX: Power values were assumed to be in Watts with no prefix (ie, kW etc were not recognised).


## [1.0.5] - 2026-05-03

BUGFIX: Rounding error when calculating energy-value prefixes resulted in a display of "1000kWh" rather than "1MWh"

## [1.0.6] - 2026-05-11

Round the 'solar ratio' value to the nearest 0.05 rather than 0.1 to improve accuracy of the display

