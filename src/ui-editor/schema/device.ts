import { DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, EntitiesOptions } from '@/config';
import { secondaryInfoSchema, singleValueNodeSchema } from '.';
import { EnergyDirection, EnergyType } from '@/enums';

export function deviceSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: DeviceConfig | undefined): any[] {
  const result: any[] = [
    {
      type: 'grid',
      schema: [
        { name: DeviceOptions.Name, required: true, selector: { text: {} } },
        { name: DeviceOptions.Icon, selector: { icon: {} } },
        {
          name: DeviceOptions.EnergyType,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                EnergyType.getItem(EnergyType.Electric),
                EnergyType.getItem(EnergyType.Gas)
              ]
            }
          }
        },
        {
          name: DeviceOptions.EnergyDirection,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                EnergyDirection.getItem(EnergyDirection.Consumer),
                EnergyDirection.getItem(EnergyDirection.Source),
                EnergyDirection.getItem(EnergyDirection.Both)
              ]
            }
          }
        }
      ]
    }
  ].concat(singleValueNodeSchema(config, schemaConfig));

  result.push(secondaryInfoSchema(config, schemaConfig?.[EntitiesOptions.Secondary_Info]));
  return result;
}
