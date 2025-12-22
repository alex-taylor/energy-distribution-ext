import { AppearanceOptions, ColourOptions, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, OverridesOptions, SecondaryInfoOptions, AppearanceConfig, AppearanceOptionsConfig, DualValueNodeConfig, EnergyFlowCardExtConfig, EnergyUnitsConfig, FlowsConfig, NodeConfig, SecondaryInfoConfig, SingleValueNodeConfig, LowCarbonConfig, SingleValueColourConfig, DualValueColourConfig } from '@/config';
import { ColourMode, DisplayMode, InactiveFlowsMode, Scale, UnitPosition, UnitPrefixes } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';

//================================================================================================================================================================================//

export function generalConfigSchema(config: EnergyFlowCardExtConfig | undefined) {
  return [
    {
      name: GlobalOptions.Title,
      selector: { text: {} },
    },
    {
      name: GlobalOptions.Display_Mode,
      required: true,
      selector: {
        select: {
          mode: 'dropdown',
          options: [
            DisplayMode.getItem(DisplayMode.Today),
            DisplayMode.getItem(DisplayMode.History),
            DisplayMode.getItem(DisplayMode.Hybrid)
          ]
        }
      }
    }
  ];
}

//================================================================================================================================================================================//

export function appearanceSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: AppearanceConfig | undefined) {
  return [
    {
      name: [GlobalOptions.Options],
      type: 'expandable',
      schema: appearanceOptionsSchema(config, schemaConfig?.[GlobalOptions.Options])
    },
    {
      name: AppearanceOptions.Flows,
      type: 'expandable',
      schema: flowsOptionsSchema(config, schemaConfig?.[AppearanceOptions.Flows])
    },
    {
      name: AppearanceOptions.Energy_Units,
      type: 'expandable',
      schema: energyUnitsOptionsSchema(config, schemaConfig?.[AppearanceOptions.Energy_Units])
    }
  ];
}

//================================================================================================================================================================================//

function appearanceOptionsSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: AppearanceOptionsConfig | undefined): any[] {
  return [
    {
      type: 'grid',
      schema: [
        {
          name: AppearanceOptions.Dashboard_Link,
          selector: { navigation: {} }
        },
        {
          name: AppearanceOptions.Dashboard_Link_Label,
          selector: { text: {} }
        },
        {
          name: AppearanceOptions.Show_Zero_States,
          selector: { boolean: {} }
        },
        {
          name: AppearanceOptions.Clickable_Entities,
          selector: { boolean: {} }
        },
        {
          name: AppearanceOptions.Segment_Gaps,
          selector: { boolean: {} }
        }
      ]
    }
  ];
}

//================================================================================================================================================================================//

function energyUnitsOptionsSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: EnergyUnitsConfig | undefined): any[] {
  return [
    {
      type: 'grid',
      schema: [
        {
          name: EnergyUnitsOptions.Unit_Prefixes,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                UnitPrefixes.getItem(UnitPrefixes.Unified),
                UnitPrefixes.getItem(UnitPrefixes.Individual)
              ]
            }
          }
        },
        {
          name: EnergyUnitsOptions.Unit_Position,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                UnitPosition.getItem(UnitPosition.After_Space),
                UnitPosition.getItem(UnitPosition.Before_Space),
                UnitPosition.getItem(UnitPosition.After),
                UnitPosition.getItem(UnitPosition.Before),
                UnitPosition.getItem(UnitPosition.Hidden)
              ]
            }
          }
        },
        {
          name: EnergyUnitsOptions.Wh_Kwh_Threshold,
          required: true,
          selector: { number: { mode: 'box', min: 0, max: 1000000, step: 1 } }
        },
        {
          name: EnergyUnitsOptions.Kwh_Mwh_Threshold,
          required: true,
          selector: { number: { mode: 'box', min: 0, max: 1000000, step: 1 } }
        }
      ]
    },
    {
      type: 'grid',
      column_min_width: '67px',
      schema: [
        {
          name: EnergyUnitsOptions.Display_Precision_Under_10,
          selector: { number: { mode: 'box', min: 0, max: 3, step: 1 } }
        },
        {
          name: EnergyUnitsOptions.Display_Precision_Under_100,
          selector: { number: { mode: 'box', min: 0, max: 3, step: 1 } }
        },
        {
          name: EnergyUnitsOptions.Display_Precision_Default,
          selector: { number: { mode: 'box', min: 0, max: 3, step: 1 } }
        }
      ]
    }
  ];
}

//================================================================================================================================================================================//

function flowsOptionsSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: FlowsConfig | undefined): any[] {
  return [
    {
      type: 'grid',
      schema: [
        {
          name: FlowsOptions.Inactive_Flows,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                InactiveFlowsMode.getItem(InactiveFlowsMode.Normal),
                InactiveFlowsMode.getItem(InactiveFlowsMode.Dimmed),
                InactiveFlowsMode.getItem(InactiveFlowsMode.Greyed)
              ]
            }
          }
        },
        {
          name: FlowsOptions.Scale,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                Scale.getItem(Scale.Linear),
                Scale.getItem(Scale.Logarithmic)
              ]
            }
          }
        },
        {
          name: FlowsOptions.Use_Hourly_Stats,
          selector: { boolean: {} }
        },
        {
          name: FlowsOptions.Use_HASS_Style,
          selector: { boolean: {} }
        },
        {
          name: FlowsOptions.Animation,
          selector: { boolean: {} }
        }
      ]
    },
    dynamicFlowsOptionsSchema(config, schemaConfig)
  ];
}

//================================================================================================================================================================================//

function dynamicFlowsOptionsSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: FlowsConfig | undefined): {} {
  if (!(schemaConfig?.[FlowsOptions.Animation] ?? true)) {
    return {};
  }

  return {
    type: 'grid',
    schema: [
      {
        name: FlowsOptions.Min_Rate,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 10, step: 0.1 } }
      },
      {
        name: FlowsOptions.Max_Rate,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 10, step: 0.1 } }
      }
    ]
  };
}

//================================================================================================================================================================================//

export function nodeConfigSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: NodeConfig | undefined, entitySchema: any[] | undefined): any[] {
  let result: Array<any> = [];

  if (entitySchema) {
    result = result.concat(entitySchema);
  }

  result.push(
    {
      name: EntitiesOptions.Overrides,
      type: 'expandable',
      schema: [
        {
          type: 'grid',
          schema: [
            { name: OverridesOptions.Name, selector: { text: {} } },
            { name: OverridesOptions.Icon, selector: { icon: {} } }
          ]
        }
      ]
    },
    secondaryInfoSchema(config, schemaConfig?.[EntitiesOptions.Secondary_Info])
  );

  return result;
};

//================================================================================================================================================================================//

export function singleValueNodeSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SingleValueNodeConfig | undefined): any[] {
  return [
    {
      name: EntitiesOptions.Entities,
      type: 'expandable',
      schema: [
        {
          name: EntityOptions.Entity_Ids,
          selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } }
        }
      ]
    },
    singleValueColourSchema(config, schemaConfig)
  ];
}

//================================================================================================================================================================================//

export function singleValueColourSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SingleValueNodeConfig | LowCarbonConfig | undefined): {} {
  return {
    name: EntitiesOptions.Colours,
    type: 'expandable',
    schema: [
      {
        type: 'grid',
        schema: [
          ...colourSchema(
            schemaConfig,
            ColourOptions.Flow,
            [
              ColourMode.getItem(ColourMode.Default),
              ColourMode.getItem(ColourMode.Custom)
            ]
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Value,
            [
              ColourMode.getItem(ColourMode.Do_Not_Colour),
              ColourMode.getItem(ColourMode.Flow),
              ColourMode.getItem(ColourMode.Custom)
            ]
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Icon,
            [
              ColourMode.getItem(ColourMode.Do_Not_Colour),
              ColourMode.getItem(ColourMode.Flow),
              ColourMode.getItem(ColourMode.Custom)
            ]
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Secondary,
            [
              ColourMode.getItem(ColourMode.Do_Not_Colour),
              ColourMode.getItem(ColourMode.Flow),
              ColourMode.getItem(ColourMode.Custom)
            ]
          )
        ]
      }
    ]
  };
}

//================================================================================================================================================================================//

export function dualValueNodeSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: DualValueNodeConfig | undefined): any[] {
  return [
    {
      name: EntitiesOptions.Import_Entities,
      type: 'expandable',
      schema: [
        {
          name: EntityOptions.Entity_Ids,
          selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } }
        }
      ]
    },
    {
      name: EntitiesOptions.Export_Entities,
      type: 'expandable',
      schema: [
        {
          name: EntityOptions.Entity_Ids,
          selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } }
        }
      ]
    },
    {
      name: EntitiesOptions.Colours,
      type: 'expandable',
      schema: [
        {
          type: 'grid',
          schema: [
            ...colourSchema(
              schemaConfig,
              ColourOptions.Flow_Import,
              [
                ColourMode.getItem(ColourMode.Default),
                ColourMode.getItem(ColourMode.Custom)
              ]
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Flow_Export,
              [
                ColourMode.getItem(ColourMode.Default),
                ColourMode.getItem(ColourMode.Custom)
              ]
            ),
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
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Value_Import,
              [
                ColourMode.getItem(ColourMode.Do_Not_Colour),
                ColourMode.getItem(ColourMode.Flow),
                ColourMode.getItem(ColourMode.Custom)
              ]
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Value_Export,
              [
                ColourMode.getItem(ColourMode.Do_Not_Colour),
                ColourMode.getItem(ColourMode.Flow),
                ColourMode.getItem(ColourMode.Custom)
              ]
            ),
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
          ]
        }
      ]
    }
  ];
}

//================================================================================================================================================================================//

export function colourSchema(config: SingleValueNodeConfig | DualValueNodeConfig | undefined, name: string, options: any[]): any[] {
  const schema: any[] = [{
    name: name,
    required: true,
    selector: {
      select: {
        mode: 'dropdown',
        options: options
      }
    }
  }];

  if (config?.[EntitiesOptions.Colours]?.[name] === ColourMode.Custom) {
    schema.push({
      name: name.replace("mode", "colour"),
      selector: { color_rgb: {} }
    });
  } else {
    schema.push({});
  }

  return schema;
}

//================================================================================================================================================================================//

export function secondaryInfoSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SecondaryInfoConfig | undefined): {} {
  return {
    name: EntitiesOptions.Secondary_Info,
    type: 'expandable',
    schema: [
      {
        name: EntityOptions.Entity_Id,
        selector: { entity: {} }
      },
      {
        type: 'grid',
        column_min_width: '150px',
        schema: [
          {
            name: EntityOptions.Unit_Position,
            required: true,
            selector: {
              select: {
                mode: 'dropdown',
                options: [
                  UnitPosition.getItem(UnitPosition.After_Space),
                  UnitPosition.getItem(UnitPosition.Before_Space),
                  UnitPosition.getItem(UnitPosition.After),
                  UnitPosition.getItem(UnitPosition.Before),
                  UnitPosition.getItem(UnitPosition.Hidden)
                ]
              }
            }
          },
          { name: EntityOptions.Units, selector: { text: {} } },
          { name: EntityOptions.Zero_Threshold, selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } } },
          { name: EntityOptions.Display_Precision, selector: { number: { mode: 'box', min: 0, max: 3, step: 1 } } }
        ]
      },
      {
        name: [SecondaryInfoOptions.Icon],
        selector: { icon: {} }
      }
    ]
  };
}

//================================================================================================================================================================================//
