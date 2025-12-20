import { DeviceConfig, DeviceOptions, DeviceType, EnergyFlowCardExtConfig, EntitiesOptions } from '@/config';
import { secondaryInfoSchema, singleValueNodeSchema } from '.';

export function deviceSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: DeviceConfig | undefined): any[] {
  const result: any[] = [
    {
      type: 'grid',
      schema: [
        { name: DeviceOptions.Name, required: true, selector: { text: {} } },
        { name: DeviceOptions.Icon, selector: { icon: {} } }
      ]
    },
    {
      type: 'grid',
      name: DeviceOptions.Type,
      schema: [
        { name: DeviceType.ElectricConsumer, selector: { boolean: {} } },
        { name: DeviceType.GasConsumer, selector: { boolean: {} } },
        { name: DeviceType.ElectricSource, selector: { boolean: {} } },
        { name: DeviceType.GasSource, selector: { boolean: {} } }
      ]
    }
  ].concat(singleValueNodeSchema(config, schemaConfig));

  result.push(secondaryInfoSchema(config, schemaConfig?.[EntitiesOptions.Secondary_Info]));
  return result;
}
