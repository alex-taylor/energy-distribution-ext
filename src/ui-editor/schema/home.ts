import { colourSchema, getDropdownValues, nodeConfigSchema } from '.';
import { ColourMode, GasSourcesMode } from '@/enums';
import { ColourOptions, EditorPages, EntitiesOptions, EnergyFlowCardExtConfig, HomeConfig, GlobalOptions, HomeOptions } from '@/config';

export function homeSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: HomeConfig | undefined): any[] {
  return nodeConfigSchema(config, config?.[EditorPages.Home], undefined)
    .concat(
      {
        type: 'expandable',
        name: EntitiesOptions.Colours,
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
        type: 'expandable',
        name: GlobalOptions.Options,
        schema: [
          { name: HomeOptions.Subtract_Consumers, selector: { boolean: {} } },
          { name: HomeOptions.Gas_Sources, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(GasSourcesMode) } } },
          dynamicHomeOptionsSchema(schemaConfig)
        ]
      }
    );
}

const dynamicHomeOptionsSchema = (schemaConfig: HomeConfig | undefined): {} => {
  if (schemaConfig?.[GlobalOptions.Options]?.[HomeOptions.Gas_Sources] !== GasSourcesMode.Automatic) {
    return {};
  }

  return {
    name: HomeOptions.Gas_Sources_Threshold,
    required: true,
    selector: { number: { mode: 'box', min: 0, max: 100, step: 1 } }
  };
}
