import { EditorPages, EnergyDistributionExtConfig, GlobalOptions, SolarConfig, SolarOptions } from '@/config';
import { nodeConfigSchema, SchemaTypes, singleValueNodeSchema } from '.';
import { DisplayMode, ELECTRIC_ENTITY_CLASSES } from '@/enums';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

//================================================================================================================================================================================//

export const solarSchema = memoizeOne((config: EnergyDistributionExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const solarConfig: SolarConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Solar);
  return nodeConfigSchema(singleValueNodeSchema(solarConfig, mode, EditorPages.Solar, ELECTRIC_ENTITY_CLASSES, true), secondaryEntities)
    .concat(
      {
        key: GlobalOptions,
        name: GlobalOptions.Options,
        type: SchemaTypes.Expandable,
        schema: [
          { key: SolarOptions, name: SolarOptions.Show_Consumption_Ratio, required: true, selector: { boolean: {} } },
          { key: SolarOptions, name: SolarOptions.Show_Consumption_Percentage, required: true, selector: { boolean: {} } }
        ]
      }
    );
});

//================================================================================================================================================================================//
