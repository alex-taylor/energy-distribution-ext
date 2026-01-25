import { ColourOptions, DeviceConfig, DeviceOptions, NodeOptions, EntitiesOptions } from '@/config';
import { colourSchema, dropdownSelector, getDropdownValues, SchemaTypes, secondaryInfoSchema } from '.';
import { ColourMode, DeviceClasses, EnergyDirection, EnergyType } from '@/enums';
import { BASIC_COLOUR_MODES_DUAL, BASIC_COLOUR_MODES_SINGLE, DEFAULT_DEVICE_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const deviceSchema = memoizeOne((schemaConfig: DeviceConfig, secondaryEntities: string[]): any[] => {
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
    energyDirection !== EnergyDirection.Consumer_Only ?
      {
        key: NodeOptions,
        name: NodeOptions.Import_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }]
      } : {},
    energyDirection !== EnergyDirection.Source_Only ?
      {
        key: NodeOptions,
        name: NodeOptions.Export_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }]
      } : {},
    {
      key: NodeOptions,
      name: NodeOptions.Colours,
      type: SchemaTypes.Expandable,
      schema: [{ type: SchemaTypes.Grid, schema: colourSchemas }]
    },
    secondaryInfoSchema(secondaryEntities)
  ];

  switch (energyDirection) {
    case EnergyDirection.Both:
      colourSchemas.push(
        { key: ColourOptions, name: ColourOptions.Flow_Import_Colour, selector: { color_rgb: {} } },
        { key: ColourOptions, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } }
      );
      break;

    case EnergyDirection.Consumer_Only:
      colourSchemas.push(
        { key: ColourOptions, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } },
        {}
      );
      break;

    case EnergyDirection.Source_Only:
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
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL)
      )
    );
  } else {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Circle,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection !== EnergyDirection.Consumer_Only) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Import,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection !== EnergyDirection.Source_Only) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Export,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection === EnergyDirection.Both) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Icon,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL)
      ),
      ...colourSchema(
        schemaConfig,
        ColourOptions.Secondary,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL)
      )
    );
  } else {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Icon,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      ),
      ...colourSchema(
        schemaConfig,
        ColourOptions.Secondary,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  return result;
});
