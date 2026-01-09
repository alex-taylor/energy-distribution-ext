import { EditorPages, GlobalOptions, EnergyFlowCardExtConfig, LowCarbonOptions, LowCarbonConfig } from '@/config';
import { LowCarbonDisplayMode } from '@/enums';
import { dropdownSelector, nodeConfigSchema, SchemaTypes, singleValueColourSchema } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const lowCarbonSchema = memoizeOne((config: EnergyFlowCardExtConfig): any[] => {
  const lowCarbonConfig: LowCarbonConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Low_Carbon);

  return [singleValueColourSchema(lowCarbonConfig)]
    .concat(nodeConfigSchema())
    .concat(
      {
        key: GlobalOptions,
        name: GlobalOptions.Options,
        type: SchemaTypes.Expandable,
        schema: [
          { key: LowCarbonOptions, name: LowCarbonOptions.Low_Carbon_Mode, required: true, selector: dropdownSelector(LowCarbonDisplayMode) }
        ]
      }
    );
});
