import { ColourOptions, DeviceConfig, DeviceOptions, NodeOptions, EntitiesOptions, EditorPages } from '@/config';
import { colourSchema, dropdownSelector, getDropdownValues, SchemaTypes, secondaryInfoSchema } from '.';
import { ColourMode, DeviceClasses, DisplayMode, EnergyDirection, EnergyType } from '@/enums';
import { BASIC_COLOUR_MODES_DUAL, BASIC_COLOUR_MODES_SINGLE, DEFAULT_DEVICE_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const deviceSchema = memoizeOne((schemaConfig: DeviceConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
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
        mode === DisplayMode.Energy ? { key: DeviceOptions, name: DeviceOptions.Energy_Direction, required: true, selector: dropdownSelector(EnergyDirection) } : {}
      ]
    },
    mode === DisplayMode.Energy && energyDirection !== EnergyDirection.Consumer_Only ?
      {
        key: NodeOptions,
        page: EditorPages.Devices,
        name: NodeOptions.Import_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }]
      } : {},
    mode === DisplayMode.Energy && energyDirection !== EnergyDirection.Producer_Only ?
      {
        key: NodeOptions,
        page: EditorPages.Devices,
        name: NodeOptions.Export_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }]
      } : {},
    mode === DisplayMode.Power ?
      {
        key: NodeOptions,
        name: NodeOptions.Power_Entities,
        type: SchemaTypes.Expandable,
        schema: [{ key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Power } } }]
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
        { key: ColourOptions, page: EditorPages.Devices, name: ColourOptions.Flow_Import_Colour, selector: { color_rgb: {} } },
        { key: ColourOptions, page: EditorPages.Devices, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } }
      );
      break;

    case EnergyDirection.Consumer_Only:
      colourSchemas.push(
        { key: ColourOptions, page: EditorPages.Devices, name: ColourOptions.Flow_Export_Colour, selector: { color_rgb: {} } },
        {}
      );
      break;

    case EnergyDirection.Producer_Only:
      colourSchemas.push(
        { key: ColourOptions, page: EditorPages.Devices, name: ColourOptions.Flow_Import_Colour, selector: { color_rgb: {} } },
        {}
      );
      break;
  }

  if (energyDirection === EnergyDirection.Both) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Circle,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL, EditorPages.Devices)
      )
    );
  } else {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Circle,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection !== EnergyDirection.Consumer_Only) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        EditorPages.Devices,
        ColourOptions.Value_Import,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection !== EnergyDirection.Producer_Only) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        EditorPages.Devices,
        ColourOptions.Value_Export,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  if (energyDirection === EnergyDirection.Both) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Icon,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL, EditorPages.Devices)
      ),
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Secondary,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL, EditorPages.Devices)
      )
    );
  } else {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Icon,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      ),
      ...colourSchema(
        schemaConfig,
        undefined,
        ColourOptions.Secondary,
        getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
      )
    );
  }

  return result;
});
