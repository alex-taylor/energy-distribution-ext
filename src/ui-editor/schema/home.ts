import { colourSchema, nodeConfigSchema } from '.';
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
                [
                  ColourMode.getItem(ColourMode.Dynamic),
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Largest_Value),
                  ColourMode.getItem(ColourMode.Solar),
                  ColourMode.getItem(ColourMode.High_Carbon),
                  ColourMode.getItem(ColourMode.Low_Carbon),
                  ColourMode.getItem(ColourMode.Battery),
                  ColourMode.getItem(ColourMode.Gas),
                  ColourMode.getItem(ColourMode.Custom)
                ]
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Value,
                [
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Largest_Value),
                  ColourMode.getItem(ColourMode.Solar),
                  ColourMode.getItem(ColourMode.High_Carbon),
                  ColourMode.getItem(ColourMode.Low_Carbon),
                  ColourMode.getItem(ColourMode.Battery),
                  ColourMode.getItem(ColourMode.Gas),
                  ColourMode.getItem(ColourMode.Custom)
                ]
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Icon,
                [
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Largest_Value),
                  ColourMode.getItem(ColourMode.Solar),
                  ColourMode.getItem(ColourMode.High_Carbon),
                  ColourMode.getItem(ColourMode.Low_Carbon),
                  ColourMode.getItem(ColourMode.Battery),
                  ColourMode.getItem(ColourMode.Gas),
                  ColourMode.getItem(ColourMode.Custom)
                ]
              ),
              ...colourSchema(
                schemaConfig,
                ColourOptions.Secondary,
                [
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Largest_Value),
                  ColourMode.getItem(ColourMode.Solar),
                  ColourMode.getItem(ColourMode.High_Carbon),
                  ColourMode.getItem(ColourMode.Low_Carbon),
                  ColourMode.getItem(ColourMode.Battery),
                  ColourMode.getItem(ColourMode.Gas),
                  ColourMode.getItem(ColourMode.Custom)
                ]
              )
            ]
          }
        ]
      },
      {
        type: 'expandable',
        name: GlobalOptions.Options,
        schema: [
          {
            name: HomeOptions.Subtract_Consumers,
            selector: { boolean: {} }
          },
          {
            name: HomeOptions.Gas_Sources,
            required: true,
            selector: {
              select: {
                mode: 'dropdown',
                options: [
                  GasSourcesMode.getItem(GasSourcesMode.Do_Not_Show),
                  GasSourcesMode.getItem(GasSourcesMode.Add_To_Total),
                  GasSourcesMode.getItem(GasSourcesMode.Show_Separately),
                  GasSourcesMode.getItem(GasSourcesMode.Automatic)
                ]
              }
            }
          },
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
