import { AppearanceOptions, ColourOptions, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, OverridesOptions, SecondaryInfoOptions, AppearanceConfig, AppearanceOptionsConfig, DualValueNodeConfig, EnergyFlowCardExtConfig, EnergyUnitsConfig, FlowsConfig, NodeConfig, SecondaryInfoConfig, SingleValueNodeConfig, LowCarbonConfig } from '@/config';
import { ColourMode, DisplayMode, DotsMode, FlowColourMode, InactiveFlowsMode, UnitPosition, UnitPrefixes } from '@/enums';
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
          name: FlowsOptions.Use_Hourly_Stats,
          selector: { boolean: {} }
        },
        {
          name: FlowsOptions.Use_HASS_Colours,
          selector: { boolean: {} }
        },
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
          name: FlowsOptions.Animation,
          required: true,
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                DotsMode.getItem(DotsMode.Dynamic),
                DotsMode.getItem(DotsMode.HASS),
                DotsMode.getItem(DotsMode.Off)
              ]
            }
          }
        }
      ]
    },
    dynamicFlowsOptionsSchema(config, schemaConfig)
  ];
}

//================================================================================================================================================================================//

function dynamicFlowsOptionsSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: FlowsConfig | undefined): {} {
  if (schemaConfig?.[FlowsOptions.Animation] !== DotsMode.Dynamic) {
    return {};
  }

  return {
    type: 'grid',
    schema: [
      {
        name: FlowsOptions.Min_Rate,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } }
      },
      {
        name: FlowsOptions.Max_Rate,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } }
      },
      {
        name: FlowsOptions.Min_Energy,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } }
      },
      {
        name: FlowsOptions.Max_Energy,
        required: true,
        selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } }
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
          {
            name: ColourOptions.Flow,
            required: true,
            selector: {
              select: {
                mode: 'dropdown',
                options: [
                  FlowColourMode.getItem(FlowColourMode.HASS),
                  FlowColourMode.getItem(FlowColourMode.Custom)
                ]
              }
            }
          },
          colourPickerSchema(config, schemaConfig?.[EntitiesOptions.Colours]?.[ColourOptions.Flow], ColourOptions.Custom_Colour),
          {
            name: ColourOptions.Value,
            required: true,
            selector: {
              select: {
                mode: 'dropdown',
                options: [
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Flow)
                ]
              }
            }
          },
          {
            name: ColourOptions.Icon,
            required: true,
            selector: {
              select: {
                mode: 'dropdown',
                options: [
                  ColourMode.getItem(ColourMode.Do_Not_Colour),
                  ColourMode.getItem(ColourMode.Flow)
                ]
              }
            }
          }
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
            {
              name: ColourOptions.Import_Flow,
              required: true,
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    FlowColourMode.getItem(FlowColourMode.HASS),
                    FlowColourMode.getItem(FlowColourMode.Custom)
                  ]
                }
              }
            },
            colourPickerSchema(config, schemaConfig?.[EntitiesOptions.Colours]?.[ColourOptions.Import_Flow], ColourOptions.Import_Colour),
            {
              name: ColourOptions.Export_Flow,
              required: true,
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    FlowColourMode.getItem(FlowColourMode.HASS),
                    FlowColourMode.getItem(FlowColourMode.Custom)
                  ]
                }
              }
            },
            colourPickerSchema(config, schemaConfig?.[EntitiesOptions.Colours]?.[ColourOptions.Export_Flow], ColourOptions.Export_Colour),
            {
              name: [ColourOptions.Circle],
              required: true,
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    ColourMode.getItem(ColourMode.Larger_Value),
                    ColourMode.getItem(ColourMode.Import),
                    ColourMode.getItem(ColourMode.Export),
                    ColourMode.getItem(ColourMode.Dynamic)
                  ]
                }
              }
            },
            {
              name: [ColourOptions.Values],
              required: true,
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    ColourMode.getItem(ColourMode.Do_Not_Colour),
                    ColourMode.getItem(ColourMode.Flow)
                  ]
                }
              }
            },
            {
              name: [ColourOptions.Icon],
              required: true,
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    ColourMode.getItem(ColourMode.Do_Not_Colour),
                    ColourMode.getItem(ColourMode.Larger_Value),
                    ColourMode.getItem(ColourMode.Import),
                    ColourMode.getItem(ColourMode.Export)
                  ]
                }
              }
            }
          ]
        }
      ]
    }
  ];
}

//================================================================================================================================================================================//

export function colourPickerSchema(config: EnergyFlowCardExtConfig | undefined, flowMode: FlowColourMode | undefined, name: string): {} {
  if (flowMode === FlowColourMode.Custom) {
    return {
      name: name,
      selector: { color_rgb: {} }
    };
  }

  return {};
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
