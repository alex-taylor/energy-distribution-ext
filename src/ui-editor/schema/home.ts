import { colourSchema, dropdownSelector, getDropdownValues, nodeConfigSchema, SchemaTypes, SelectorModes } from '.';
import { ColourMode, GasSourcesMode } from '@/enums';
import { ColourOptions, EntitiesOptions, HomeConfig, GlobalOptions, HomeOptions } from '@/config';
import { DEFAULT_HOME_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const homeSchema = memoizeOne((schemaConfig: HomeConfig): any[] => {
  return nodeConfigSchema()
    .concat(
      {
        key: EntitiesOptions,
        name: EntitiesOptions.Colours,
        type: SchemaTypes.Expandable,
        schema: [
          {
            type: SchemaTypes.Grid,
            schema: [
              ...colourSchema(
                schemaConfig,
                ColourOptions.Circle,
                getDropdownValues(ColourMode, [ColourMode.Dynamic, ColourMode.Do_Not_Colour, ColourMode.Largest_Value, ColourMode.Solar, ColourMode.High_Carbon, ColourMode.Low_Carbon, ColourMode.Battery, ColourMode.Gas, ColourMode.Custom])
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Value,
                getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Largest_Value, ColourMode.Solar, ColourMode.High_Carbon, ColourMode.Low_Carbon, ColourMode.Battery, ColourMode.Gas, ColourMode.Custom])
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Icon,
                getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Largest_Value, ColourMode.Solar, ColourMode.High_Carbon, ColourMode.Low_Carbon, ColourMode.Battery, ColourMode.Gas, ColourMode.Custom])
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Secondary,
                getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Largest_Value, ColourMode.Solar, ColourMode.High_Carbon, ColourMode.Low_Carbon, ColourMode.Battery, ColourMode.Gas, ColourMode.Custom])
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
          dynamicHomeOptionsSchema(schemaConfig)
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
