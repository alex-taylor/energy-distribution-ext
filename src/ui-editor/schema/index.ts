import { AppearanceOptions, ColourOptions, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, OverridesOptions, SecondaryInfoOptions, AppearanceConfig, AppearanceOptionsConfig, DualValueNodeConfig, EnergyFlowCardExtConfig, EnergyUnitsConfig, FlowsConfig, NodeConfig, SecondaryInfoConfig, SingleValueNodeConfig, LowCarbonConfig } from '@/config';
import { ColourMode, DisplayMode, EnergyUnits, VolumeUnits, InactiveFlowsMode, PrefixThreshold, Scale, UnitPosition, UnitPrefixes } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';
import { localize } from '@/localize/localize';

export interface DropdownValue {
  label: string;
  value: string;
}

//================================================================================================================================================================================//

export function generalConfigSchema(config: EnergyFlowCardExtConfig | undefined): any[] {
  return [
    { name: GlobalOptions.Title, selector: { text: {} }, },
    { name: GlobalOptions.Display_Mode, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(DisplayMode) } } }
  ];
}

//================================================================================================================================================================================//

export function appearanceSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: AppearanceConfig | undefined): any[] {
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
        { name: AppearanceOptions.Dashboard_Link, selector: { navigation: {} } },
        { name: AppearanceOptions.Dashboard_Link_Label, selector: { text: {} } },
        { name: AppearanceOptions.Show_Zero_States, selector: { boolean: {} } },
        { name: AppearanceOptions.Clickable_Entities, selector: { boolean: {} } },
        { name: AppearanceOptions.Segment_Gaps, selector: { boolean: {} } },
        { name: AppearanceOptions.Use_HASS_Style, selector: { boolean: {} } }
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
        { name: EnergyUnitsOptions.Unit_Position, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(UnitPosition) } } },
        { name: EnergyUnitsOptions.Prefix_Threshold, required: true, selector: { select: { mode: 'dropdown', options: Object.values(PrefixThreshold).filter(value => !isNaN(Number(value))) } } },
        { name: EnergyUnitsOptions.Electric_Units, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(EnergyUnits) } } },
        { name: EnergyUnitsOptions.Electric_Unit_Prefixes, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(UnitPrefixes) } } },
        { name: EnergyUnitsOptions.Gas_Units, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(VolumeUnits) } } },
        { name: EnergyUnitsOptions.Gas_Unit_Prefixes, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(UnitPrefixes) } } }
      ]
    },
    schemaConfig?.[EnergyUnitsOptions.Gas_Units] !== VolumeUnits.Same_As_Electric ? { type: 'grid', schema: [{ name: EnergyUnitsOptions.Gas_Calorific_Value, selector: { number: { mode: 'box', min: 0 } } }] } : {},
    {
      type: 'grid',
      column_min_width: '67px',
      schema: [
        { name: EnergyUnitsOptions.Display_Precision_Under_10, selector: { number: { mode: 'box', min: 0, max: 3, unit_of_measurement: 'dp' } } },
        { name: EnergyUnitsOptions.Display_Precision_Under_100, selector: { number: { mode: 'box', min: 0, max: 3, unit_of_measurement: 'dp' } } },
        { name: EnergyUnitsOptions.Display_Precision_Default, selector: { number: { mode: 'box', min: 0, max: 3, unit_of_measurement: 'dp' } } }
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
        { name: FlowsOptions.Use_Hourly_Stats, selector: { boolean: {} } },
        { name: FlowsOptions.Animation, selector: { boolean: {} } },
        { name: FlowsOptions.Inactive_Flows, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(InactiveFlowsMode) } } },
        { name: FlowsOptions.Scale, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(Scale) } } }
      ]
    }
  ];
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

export function singleValueNodeSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SingleValueNodeConfig | undefined, deviceClasses: string[], isSolarNode: boolean = false): any[] {
  return [
    {
      name: EntitiesOptions.Entities,
      type: 'expandable',
      schema: [
        { name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: deviceClasses } } }
      ]
    },
    singleValueColourSchema(config, schemaConfig, isSolarNode)
  ];
}

//================================================================================================================================================================================//

export function singleValueColourSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SingleValueNodeConfig | LowCarbonConfig | undefined, isSolarNode: boolean = false): {} {
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
            getDropdownValues(ColourMode, [ColourMode.Default, ColourMode.Custom]),
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Circle,
            isSolarNode
              ? getDropdownValues(ColourMode, [ColourMode.Dynamic, ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
              : getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Value,
            getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Icon,
            getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
          ),
          ...colourSchema(
            schemaConfig,
            ColourOptions.Secondary,
            getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
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
        { name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }
      ]
    },
    {
      name: EntitiesOptions.Export_Entities,
      type: 'expandable',
      schema: [
        { name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }
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
              getDropdownValues(ColourMode, [ColourMode.Default, ColourMode.Custom])
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Flow_Export,
              getDropdownValues(ColourMode, [ColourMode.Default, ColourMode.Custom])
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Circle,
              getDropdownValues(ColourMode, [ColourMode.Dynamic, ColourMode.Larger_Value, ColourMode.Import, ColourMode.Export, ColourMode.Do_Not_Colour, ColourMode.Custom])
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Value_Import,
              getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
            ),
            ...colourSchema(
              schemaConfig,
              ColourOptions.Value_Export,
              getDropdownValues(ColourMode, [ColourMode.Do_Not_Colour, ColourMode.Flow, ColourMode.Custom])
            ),
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
          ]
        }
      ]
    }
  ];
}

//================================================================================================================================================================================//

export function colourSchema(config: SingleValueNodeConfig | DualValueNodeConfig | undefined, name: string, options: any[]): any[] {
  return [
    {
      name: name,
      required: true,
      selector: {
        select: {
          mode: 'dropdown',
          options: options
        }
      }
    },
    config?.[EntitiesOptions.Colours]?.[name] === ColourMode.Custom ? { name: name.replace("mode", "colour"), selector: { color_rgb: {} } } : {}
  ];
}

//================================================================================================================================================================================//

export function secondaryInfoSchema(config: EnergyFlowCardExtConfig | undefined, schemaConfig: SecondaryInfoConfig | undefined): {} {
  return {
    name: EntitiesOptions.Secondary_Info,
    type: 'expandable',
    schema: [
      { name: EntityOptions.Entity_Id, selector: { entity: {} } },
      {
        type: 'grid',
        column_min_width: '150px',
        schema: [
          { name: SecondaryInfoOptions.Unit_Position, required: true, selector: { select: { mode: 'dropdown', options: getDropdownValues(UnitPosition) } } },
          { name: SecondaryInfoOptions.Units, selector: { text: {} } },
          { name: SecondaryInfoOptions.Zero_Threshold, selector: { number: { mode: 'box', min: 0, max: 1000000, step: 0.01 } } },
          { name: SecondaryInfoOptions.Display_Precision, selector: { number: { mode: 'box', min: 0, max: 3, step: 1 } } }
        ]
      },
      { name: [SecondaryInfoOptions.Icon], selector: { icon: {} } }
    ]
  };
}

//================================================================================================================================================================================//

export function getDropdownValues(type: any, values: any[] = []): DropdownValue[] {
  const enumValues: any[] = Object.values(type);

  if (values.length === 0) {
    values = enumValues;
  } else {
    values = values.filter(value => enumValues.includes(value));
  }

  return values.map(value => {
    return {
      label: localize(type.name + "." + value),
      value: value
    }
  });
}

//================================================================================================================================================================================//
