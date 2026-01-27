import { EditorPages, PowerOutageOptions, EnergyFlowCardExtConfig, GridConfig, GridOptions } from '@/config';
import { dualValueNodeSchema, nodeConfigSchema, SchemaTypes } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';
import { DisplayMode } from '@/enums';

export const gridSchema = memoizeOne((config: EnergyFlowCardExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const gridConfig: GridConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Grid);

  return nodeConfigSchema(dualValueNodeSchema(gridConfig, mode, EditorPages.Grid), secondaryEntities)
    .concat(
      {
        key: GridOptions,
        name: GridOptions.Power_Outage,
        type: SchemaTypes.Expandable,
        schema: [
          { key: PowerOutageOptions, name: PowerOutageOptions.Entity_Id, selector: { entity: {} }, },
          {
            type: SchemaTypes.Grid,
            schema: [
              { key: PowerOutageOptions, name: PowerOutageOptions.Alert_State, selector: { text: {} } },
              { key: PowerOutageOptions, name: PowerOutageOptions.Alert_Icon, selector: { icon: {} } }
            ]
          },
        ]
      }
    );
});
