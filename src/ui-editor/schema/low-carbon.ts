import { EditorPages, GlobalOptions, EnergyFlowCardExtConfig, LowCarbonOptions } from '@/config';
import { LowCarbonDisplayMode } from '@/enums';
import { getDropdownValues, nodeConfigSchema, singleValueColourSchema } from '.';

export function lowCarbonSchema(config: EnergyFlowCardExtConfig | undefined): any[] {
  return [singleValueColourSchema(config, config?.[EditorPages.Low_Carbon])]
    .concat(nodeConfigSchema(config, config?.[EditorPages.Low_Carbon], undefined)
      .concat(
        {
          name: [GlobalOptions.Options],
          type: 'expandable',
          schema: [
            { name: [LowCarbonOptions.Low_Carbon_Mode], required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(LowCarbonDisplayMode) } } }
          ]
        }
      )
    );
}
