import { ColourOptions, DeviceConfig, DeviceOptions, EnergyFlowCardExtConfig, EntitiesOptions, EntityOptions } from '@/config';
import { colourSchema, secondaryInfoSchema } from '.';
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
        {
          name: DeviceOptions.Energy_Type,
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
          name: DeviceOptions.Energy_Direction,
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
        [
          ColourMode.getItem(ColourMode.Dynamic),
          ColourMode.getItem(ColourMode.Larger_Value),
          ColourMode.getItem(ColourMode.Import),
          ColourMode.getItem(ColourMode.Export),
          ColourMode.getItem(ColourMode.Do_Not_Colour),
          ColourMode.getItem(ColourMode.Custom)
        ]
      )
    );
  }

  if (energyDirection !== EnergyDirection.Consumer) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Import,
        [
          ColourMode.getItem(ColourMode.Do_Not_Colour),
          ColourMode.getItem(ColourMode.Flow),
          ColourMode.getItem(ColourMode.Custom)
        ]
      )
    );
  }

  if (energyDirection !== EnergyDirection.Source) {
    colourSchemas.push(
      ...colourSchema(
        schemaConfig,
        ColourOptions.Value_Export,
        [
          ColourMode.getItem(ColourMode.Do_Not_Colour),
          ColourMode.getItem(ColourMode.Flow),
          ColourMode.getItem(ColourMode.Custom)
        ]
      )
    );
  }

  colourSchemas.push(
    ...colourSchema(
      schemaConfig,
      ColourOptions.Icon,
      [
        ColourMode.getItem(ColourMode.Do_Not_Colour),
        ColourMode.getItem(ColourMode.Larger_Value),
        ColourMode.getItem(ColourMode.Import),
        ColourMode.getItem(ColourMode.Export),
        ColourMode.getItem(ColourMode.Custom)
      ]
    ),
    ...colourSchema(
      schemaConfig,
      ColourOptions.Secondary,
      [
        ColourMode.getItem(ColourMode.Do_Not_Colour),
        ColourMode.getItem(ColourMode.Larger_Value),
        ColourMode.getItem(ColourMode.Import),
        ColourMode.getItem(ColourMode.Export),
        ColourMode.getItem(ColourMode.Custom)
      ]
    )
  );

  result.push(secondaryInfoSchema(config, schemaConfig?.[EntitiesOptions.Secondary_Info]));
  return result;
}
