
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

## [1.0.7] - 2026-06-19

Fixed intermittent divide-by-zero bug in the animation code

## [1.1.0] - 2026-08-24 

Fixed broken display when live low-carbon values were unavailable
Fixed blank space being rendered over the device flow-line below the 'Home' circle
Read secondary entity-ids from the 'states' list rather than the 'entities' list
Fallback to zero for display precision for secondary entities which do not have an entry in the 'entities' list
Added option to override the 'Untracked consumption' label
Added option to display solar consumption as a percentage
