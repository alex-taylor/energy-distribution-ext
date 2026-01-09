import { AppearanceOptions, ColourOptions, EnergyUnitsOptions, EntitiesOptions, EntityOptions, FlowsOptions, GlobalOptions, OverridesOptions, SecondaryInfoOptions, AppearanceConfig, DualValueNodeConfig, EnergyUnitsConfig, SingleValueNodeConfig, LowCarbonConfig } from '@/config';
import { ColourMode, DisplayMode, EnergyUnits, VolumeUnits, InactiveFlowsMode, PrefixThreshold, Scale, UnitPosition, UnitPrefixes } from '@/enums';
import { DEVICE_CLASS_ENERGY } from '@/const';
import { localize } from '@/localize/localize';
import { getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const SchemaTypes = {
  Expandable: "expandable",
  Grid: "grid"
} as const;

export const SelectorModes = {
  Box: "box",
  Dropdown: "dropdown"
} as const;

export interface DropdownValue {
  label: string;
  value: string;
}

//================================================================================================================================================================================//

export const generalConfigSchema = memoizeOne((): any[] => {
  return [
    { key: GlobalOptions, name: GlobalOptions.Title, selector: { text: {} }, },
    { key: GlobalOptions, name: GlobalOptions.Display_Mode, required: true, selector: dropdownSelector(DisplayMode) },
    { key: GlobalOptions, name: GlobalOptions.Use_HASS_Config, selector: { boolean: {} } }
  ];
});

//================================================================================================================================================================================//

export const appearanceSchema = memoizeOne((schemaConfig: AppearanceConfig): any[] => {
  return [
    {
      key: GlobalOptions,
      name: GlobalOptions.Options,
      type: SchemaTypes.Expandable,
      schema: appearanceOptionsSchema()
    },
    {
      key: AppearanceOptions,
      name: AppearanceOptions.Flows,
      type: SchemaTypes.Expandable,
      schema: flowsOptionsSchema()
    },
    {
      key: AppearanceOptions,
      name: AppearanceOptions.Energy_Units,
      type: SchemaTypes.Expandable,
      schema: energyUnitsOptionsSchema(getConfigValue(schemaConfig, AppearanceOptions.Energy_Units))
    }
  ];
});

//================================================================================================================================================================================//

const appearanceOptionsSchema = memoizeOne((): any[] => {
  return [
    {
      type: SchemaTypes.Grid,
      schema: [
        { key: AppearanceOptions, name: AppearanceOptions.Dashboard_Link, selector: { navigation: {} } },
        { key: AppearanceOptions, name: AppearanceOptions.Dashboard_Link_Label, selector: { text: {} } },
        { key: AppearanceOptions, name: AppearanceOptions.Show_Zero_States, selector: { boolean: {} } },
        { key: AppearanceOptions, name: AppearanceOptions.Clickable_Entities, selector: { boolean: {} } },
        { key: AppearanceOptions, name: AppearanceOptions.Segment_Gaps, selector: { boolean: {} } },
        { key: AppearanceOptions, name: AppearanceOptions.Use_HASS_Style, selector: { boolean: {} } }
      ]
    }
  ];
});

//================================================================================================================================================================================//

const flowsOptionsSchema = memoizeOne((): any[] => {
  return [
    {
      type: SchemaTypes.Grid,
      schema: [
        { key: FlowsOptions, name: FlowsOptions.Use_Hourly_Stats, selector: { boolean: {} } },
        { key: FlowsOptions, name: FlowsOptions.Animation, selector: { boolean: {} } },
        { key: FlowsOptions, name: FlowsOptions.Inactive_Flows, required: true, selector: dropdownSelector(InactiveFlowsMode) },
        { key: FlowsOptions, name: FlowsOptions.Scale, required: true, selector: dropdownSelector(Scale) }
      ]
    }
  ];
});

//================================================================================================================================================================================//

const energyUnitsOptionsSchema = memoizeOne((schemaConfig: EnergyUnitsConfig): any[] => {
  return [
    {
      type: SchemaTypes.Grid,
      schema: [
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Unit_Position, required: true, selector: dropdownSelector(UnitPosition) },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Prefix_Threshold, required: true, selector: { select: { mode: SelectorModes.Dropdown, options: Object.values(PrefixThreshold) } } },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Electric_Units, required: true, selector: dropdownSelector(EnergyUnits) },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Electric_Unit_Prefixes, required: true, selector: dropdownSelector(UnitPrefixes) },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Gas_Units, required: true, selector: dropdownSelector(VolumeUnits) },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Gas_Unit_Prefixes, required: true, selector: dropdownSelector(UnitPrefixes) }
      ]
    },
    getConfigValue(schemaConfig, EnergyUnitsOptions.Gas_Units) !== VolumeUnits.Same_As_Electric ? { type: SchemaTypes.Grid, schema: [{ key: EnergyUnitsOptions, name: EnergyUnitsOptions.Gas_Calorific_Value, selector: { number: { mode: SelectorModes.Box, min: 0 } } }] } : {},
    {
      type: SchemaTypes.Grid,
      column_min_width: '67px',
      schema: [
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Display_Precision_Under_10, selector: displayPrecisionSelector() },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Display_Precision_Under_100, selector: displayPrecisionSelector() },
        { key: EnergyUnitsOptions, name: EnergyUnitsOptions.Display_Precision_Default, selector: displayPrecisionSelector() }
      ]
    }
  ];
});

//================================================================================================================================================================================//

export const nodeConfigSchema = memoizeOne((entitySchema: any[] = []): any[] => {
  const result: Array<any> = [...entitySchema];

  result.push(
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Overrides,
      type: SchemaTypes.Expandable,
      schema: [
        {
          type: SchemaTypes.Grid,
          schema: [
            { key: OverridesOptions, name: OverridesOptions.Name, selector: { text: {} } },
            { key: OverridesOptions, name: OverridesOptions.Icon, selector: { icon: {} } }
          ]
        }
      ]
    },
    secondaryInfoSchema()
  );

  return result;
});

//================================================================================================================================================================================//

export const singleValueNodeSchema = memoizeOne((schemaConfig: SingleValueNodeConfig, deviceClasses: string[], isSolarNode: boolean = false): any[] => {
  return [
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntityOptions, name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: deviceClasses } } }
      ]
    },
    singleValueColourSchema(schemaConfig, isSolarNode)
  ];
});

//================================================================================================================================================================================//

export const singleValueColourSchema = memoizeOne((schemaConfig: SingleValueNodeConfig | LowCarbonConfig, isSolarNode: boolean = false): {} => {
  return {
    key: EntitiesOptions,
    name: EntitiesOptions.Colours,
    type: SchemaTypes.Expandable,
    schema: [
      {
        type: SchemaTypes.Grid,
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
});

//================================================================================================================================================================================//

export const dualValueNodeSchema = memoizeOne((schemaConfig: DualValueNodeConfig): any[] => {
  return [
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Import_Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntityOptions, name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }
      ]
    },
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Export_Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntityOptions, name: EntityOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DEVICE_CLASS_ENERGY } } }
      ]
    },
    {
      key: EntitiesOptions,
      name: EntitiesOptions.Colours,
      type: SchemaTypes.Expandable,
      schema: [
        {
          type: SchemaTypes.Grid,
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
});

//================================================================================================================================================================================//

export const colourSchema = memoizeOne((config: SingleValueNodeConfig | DualValueNodeConfig, name: ColourOptions, options: DropdownValue[]): any[] => {
  return [
    {
      key: ColourOptions,
      name: name,
      required: true,
      selector: {
        select: {
          mode: SelectorModes.Dropdown,
          options: options
        }
      }
    },
    getConfigValue(config, [EntitiesOptions.Colours, name]) === ColourMode.Custom ? { key: EntitiesOptions, name: name.replace("mode", "colour"), selector: { color_rgb: {} } } : {}
  ];
});

//================================================================================================================================================================================//

export const secondaryInfoSchema = memoizeOne((): {} => {
  return {
    key: EntitiesOptions,
    name: EntitiesOptions.Secondary_Info,
    type: SchemaTypes.Expandable,
    schema: [
      { key: EntityOptions, name: EntityOptions.Entity_Id, selector: { entity: {} } },
      {
        type: SchemaTypes.Grid,
        column_min_width: '150px',
        schema: [
          { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Unit_Position, required: true, selector: dropdownSelector(UnitPosition) },
          { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Units, selector: { text: {} } },
          { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Display_Precision, selector: displayPrecisionSelector() },
          { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Icon, selector: { icon: {} } }
        ]
      }
    ]
  };
});

//================================================================================================================================================================================//

const displayPrecisionSelector = memoizeOne((): {} => {
  return { number: { mode: SelectorModes.Box, min: 0, max: 3, step: 1, unit_of_measurement: "dp" } };
});

//================================================================================================================================================================================//

export const dropdownSelector = memoizeOne((type: any): {} => {
  return { select: { mode: SelectorModes.Dropdown, options: getDropdownValues(type) } };
});

//================================================================================================================================================================================//

export function getDropdownValues<T>(type: T, values: string[] = []): DropdownValue[] {
  const enumValues: string[] = Object.values(type as any);

  if (values.length === 0) {
    values = enumValues;
  } else {
    values = values.filter(value => enumValues.includes(value));
  }

  return values.map(value => {
    return {
      label: localize((type as any).name + "." + value),
      value: value
    }
  });
}

//================================================================================================================================================================================//
