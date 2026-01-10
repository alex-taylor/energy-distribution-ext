import { ColourOptions, DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions } from '@/config';
import { colourSchema, dropdownSelector, getDropdownValues, SchemaTypes, secondaryInfoSchema } from '.';
import { ColourMode, EnergyDirection, EnergyType } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';
import { DEFAULT_DEVICE_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const deviceSchema = memoizeOne((schemaConfig: DeviceConfig): any[] => {
  const deviceConfig: DeviceConfig[] = [schemaConfig, DEFAULT_DEVICE_CONFIG];
  const energyDirection: EnergyDirection = getConfigValue(deviceConfig, DeviceOptions.Energy_Direction);
  const colourSchemas: any[] = [];

  const result: any[] = [
    {
      type: SchemaTypes.Grid,
      schema: [
        { key: DeviceOptions, name: DeviceOptions.Name, required: true, selector: { text: {} } },
        { key: DeviceOptions, name: DeviceOptions.Icon, selector: { icon: {} } },
        { key: DeviceOptions, name: DeviceOptions.Energy_Type, required: true, selector: dropdownSelector(EnergyType) },
        { key: DeviceOptions, name: DeviceOptions.Energy_Direction, required: true, selector: dropdownSelector(EnergyDirection) }
      ]
    },
    energyDirection !== EnergyDirection.Consumer ?
      {
        key: EntitiesOptions,
        name: EntitiesOptions.Import_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntityOptions, name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }]
      } : {},
    energyDirection !== EnergyDirection.Source ?
      {
        key: EntitiesOptions,
        name: EntitiesOptions.Export_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntityOptions, name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }]
      } : {},
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Colours,
      type: SchemaTypes.Expandable,
      schema: [{ type: SchemaTypes.Grid, schema: colourSchemas }]
    },
    secondaryInfoSchema()
  ];

  switch (energyDirection) {
    case EnergyDirection.Both:
      colourSchemas.push(
        { key: ColourOptions, name: ColourOptions.Flow_Import_Colour, selector: { color_rgb: {} } },
        { key: ColourOptions, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } }
      );
      break;

    case EnergyDirection.Consumer:
      colourSchemas.push(
        { key: ColourOptions, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } },
        {}
      );
      break;

    case EnergyDirection.Source:
      colourSchemas.push(
        { key: ColourOptions, name: ColourOptions.Flow_Import_Colour, selector: { color_rgb: {} } },
        {}
      );
      break;
  }

  if (energyDirection === EnergyDirection.Both) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Circle,
        getDropdownValues(ColourMode, [ColourMode.Dynamic, ColourMode.Larger_Value, ColourMode.Import, ColourMode.Export, ColourMode.Do_Not_Colour, ColourMode.Custom])
      )
    );
  }

  if (energyDirection !== EnergyDirection.Consumer) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Import,
        getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
      )
    );
  }

  if (energyDirection !== EnergyDirection.Source) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Export,
        getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
      )
    );
  }

  colourSchemas.push(
    ...colourSchema(
      schemaConfig,
      ColourOptions.Icon,
      getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Larger_Value, ColourMode.Import, ColourMode.Export, ColourMode.Custom])
    ),
    ...colourSchema(
      schemaConfig,
      ColourOptions.Secondary,
      getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Larger_Value, ColourMode.Import, ColourMode.Export, ColourMode.Custom])
    )
  );

  return result;
});
