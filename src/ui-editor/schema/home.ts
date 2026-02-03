import { colourSchema, dropdownSelector, getDropdownValues, nodeConfigSchema, SchemaTypes, SelectorModes } from '.';
import { ColourMode, DisplayMode, GasSourcesMode } from '@/enums';
import { ColourOptions, NodeOptions, HomeConfig, GlobalOptions, HomeOptions, EnergyDistributionExtConfig, EditorPages } from '@/config';
import { DEFAULT_HOME_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

const COLOUR_MODES: ColourMode[] = [ColourMode.Do_Not_Colour, ColourMode.Automatic, ColourMode.Solar, ColourMode.High_Carbon, ColourMode.Low_Carbon, ColourMode.Battery, ColourMode.Gas, ColourMode.Custom];

export const homeSchema = memoizeOne((config: EnergyDistributionExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const homeConfig: HomeConfig = getConfigValue([config, DEFAULT_HOME_CONFIG], EditorPages.Home);

  return nodeConfigSchema([], secondaryEntities)
    .concat(
      {
        key: NodeOptions,
        name: NodeOptions.Colours,
        type: SchemaTypes.Expandable,
        schema: [
          {
            type: SchemaTypes.Grid,
            schema: [
              ...colourSchema(
                homeConfig,
                undefined,
                ColourOptions.Circle,
                getDropdownValues(ColourMode, [ColourMode.Dynamic, ...COLOUR_MODES])
              ),
              ...colourSchema(
                homeConfig,
                EditorPages.Home,
                ColourOptions.Value_Export,
                getDropdownValues(ColourMode, COLOUR_MODES)
              ),
              ...colourSchema(
                homeConfig,
                undefined,
                ColourOptions.Icon,
                getDropdownValues(ColourMode, COLOUR_MODES)
              ),
              ...colourSchema(
                homeConfig,
                undefined,
                ColourOptions.Secondary,
                getDropdownValues(ColourMode, COLOUR_MODES)
              )
            ]
          }
        ]
      },
      {
        key: GlobalOptions,
        name: GlobalOptions.Options,
        type: SchemaTypes.Expandable,
        schema: [
          { key: HomeOptions, name: HomeOptions.Subtract_Consumers, selector: { boolean: {} } },
          { key: HomeOptions, name: HomeOptions.Gas_Sources, required: true, selector: dropdownSelector(GasSourcesMode) },
          dynamicHomeOptionsSchema(homeConfig)
        ]
      }
    );
});

const dynamicHomeOptionsSchema = memoizeOne((schemaConfig: HomeConfig): {} => {
  if (getConfigValue([schemaConfig, DEFAULT_HOME_CONFIG], [GlobalOptions.Options, HomeOptions.Gas_Sources]) !== GasSourcesMode.Automatic) {
    return {};
  }

  return { key: HomeOptions, name: HomeOptions.Gas_Sources_Threshold, required: true, selector: { number: { mode: SelectorModes.Box, min: 0, max: 100, step: 1, unit_of_measurement: "%" } } };
});
