import { ColourOptions, DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions } from '@/config';
import { colourSchema, getDropdownValues, secondaryInfoSchema } from '.';
import { ColourMode, EnergyDirection, EnergyType } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';

export function deviceSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: DeviceConfig | undefined): any[] {
  const energyDirection: EnergyDirection = schemaConfig?.[DeviceOptions.Energy_Direction] || EnergyDirection.Consumer;
  const colourSchemas: any[] = [];

  const result: any[] = [
    {
      type: 'grid',
      schema: [
        { name: DeviceOptions.Name, required: true, selector: { text: {} } },
        { name: DeviceOptions.Icon, selector: { icon: {} } },
        { name: DeviceOptions.Energy_Type, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(EnergyType) } } },
        { name: DeviceOptions.Energy_Direction, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(EnergyDirection) } } }
      ]
    },
    energyDirection !== EnergyDirection.Consumer ?
      {
        name: EntitiesOptions.Import_Entities,
        type: 'expandable',
        schema: [
          {
            name: EntityOptions.Entity_Ids,
            selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } }
          }
        ]
      } : {},
    energyDirection !== EnergyDirection.Source ?
      {
        name: EntitiesOptions.Export_Entities,
        type: 'expandable',
        schema: [
          {
            name: EntityOptions.Entity_Ids,
            selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } }
          }
        ]
      } : {},
    {
      name: EntitiesOptions.Colours,
      type: 'expandable',
      schema: [
        {
          type: 'grid',
          schema: colourSchemas
        }
      ]
    }
  ];

  switch (energyDirection) {
    case EnergyDirection.Both:
      colourSchemas.push(
        {
          name: ColourOptions.Flow_Import_Colour,
          selector: { color_rgb: {} }
        },
        {
          name: ColourOptions.Flow_Export_Colour,
          selector: { color_rgb: {} }
        }
      );
      break;

    case EnergyDirection.Consumer:
      colourSchemas.push(
        {
          name: ColourOptions.Flow_Export_Colour,
          selector: { color_rgb: {} }
        },
        {}
      );
      break;

    case EnergyDirection.Source:
      colourSchemas.push(
        {
          name: ColourOptions.Flow_Import_Colour,
          selector: { color_rgb: {} }
        },
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

  result.push(secondaryInfoSchema(config, schemaConfig?.[EntitiesOptions.Secondary_Info]));
  return result;
}
