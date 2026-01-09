import { colourSchema, getDropdownValues, nodeConfigSchema } from '.';
import { ColourMode, GasSourcesMode } from '@/enums';
import { ColourOptions, EditorPages, EntitiesOptions, EnergyFlowCardExtConfig, HomeConfig, GlobalOptions, HomeOptions } from '@/config';
import { DEFAULT_CONFIG, DEFAULT_HOME_CONFIG, getConfigValue } from '@/config/config';

export function homeSchema(config: EnergyFlowCardExtConfig, schemaConfig: HomeConfig): any[] {
  return nodeConfigSchema(config, getConfigValue([config, DEFAULT_CONFIG], EditorPages.Home))
    .concat(
      {
        key: EntitiesOptions,
        name: EntitiesOptions.Colours,
        type: 'expandable',
        schema: [
          {
            type: 'grid',
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
        type: 'expandable',
        schema: [
          { key: HomeOptions, name: HomeOptions.Subtract_Consumers, selector: { boolean: {} } },
          { key: HomeOptions, name: HomeOptions.Gas_Sources, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(GasSourcesMode) } } },
          dynamicHomeOptionsSchema(schemaConfig)
        ]
      }
    );
}

const dynamicHomeOptionsSchema = (schemaConfig: HomeConfig): {} => {
  if (getConfigValue([schemaConfig, DEFAULT_HOME_CONFIG], [GlobalOptions.Options, HomeOptions.Gas_Sources]) !== GasSourcesMode.Automatic) {
    return {};
  }

  return { key: HomeOptions, name: HomeOptions.Gas_Sources_Threshold, required: true, selector: { number: { mode: 'box', min: 0, max: 100, step: 1 } } };
}
