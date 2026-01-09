import { EditorPages, PowerOutageOptions, EnergyFlowCardExtConfig, EntityOptions, GridConfig, GridOptions } from '@/config';
import { dualValueNodeSchema, nodeConfigSchema } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';

export function gridSchema(config: EnergyFlowCardExtConfig): any[] {
  const gridConfig: GridConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Grid);

  return nodeConfigSchema(config, gridConfig, dualValueNodeSchema(config, gridConfig))
    .concat(
      {
        key: GridOptions,
        name: GridOptions.Power_Outage,
        type: 'expandable',
        schema: [
          { key: EntityOptions, name: EntityOptions.Entity_Id, selector: { entity: {} }, },
          {
            type: 'grid',
            schema: [
              { key: PowerOutageOptions, name: PowerOutageOptions.Alert_State, selector: { text: {} } },
              { key: PowerOutageOptions, name: PowerOutageOptions.Alert_Icon, selector: { icon: {} } }
            ]
          },
        ]
      }
    );
}
