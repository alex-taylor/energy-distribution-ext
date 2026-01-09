import { EditorPages, GlobalOptions, EnergyFlowCardExtConfig, LowCarbonOptions, LowCarbonConfig } from '@/config';
import { LowCarbonDisplayMode } from '@/enums';
import { getDropdownValues, nodeConfigSchema, singleValueColourSchema } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';

export function lowCarbonSchema(config: EnergyFlowCardExtConfig): any[] {
  const lowCarbonConfig: LowCarbonConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Low_Carbon);

  return [singleValueColourSchema(config, lowCarbonConfig)]
    .concat(nodeConfigSchema(config, lowCarbonConfig))
    .concat(
      {
        key: GlobalOptions,
        name: GlobalOptions.Options,
        type: 'expandable',
        schema: [
          { key: LowCarbonOptions, name: LowCarbonOptions.Low_Carbon_Mode, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(LowCarbonDisplayMode) } } }
        ]
      }
    );
}
