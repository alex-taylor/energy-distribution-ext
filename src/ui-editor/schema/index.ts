import { AppearanceOptions, ColourOptions, EnergyUnitsOptions, NodeOptions, EntitiesOptions, FlowsOptions, GlobalOptions, OverridesOptions, SecondaryInfoOptions, AppearanceConfig, NodeConfig, EnergyUnitsConfig, EditorPages } from '@/config';
import { ColourMode, EnergyUnits, VolumeUnits, InactiveFlowsMode, PrefixThreshold, Scale, UnitPosition, UnitPrefixes, DateRangeDisplayMode, DeviceClasses, AnimationMode } from '@/enums';
import { localize } from '@/localize/localize';
import { BASIC_COLOUR_MODES, BASIC_COLOUR_MODES_DUAL, BASIC_COLOUR_MODES_SINGLE, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

//================================================================================================================================================================================//

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

export const dateRangeSchema = memoizeOne((): any[] => {
  return [
    { key: GlobalOptions, name: GlobalOptions.Date_Range_Live, selector: { boolean: {} } },
    { key: GlobalOptions, name: GlobalOptions.Date_Range_Display, required: true, selector: dropdownSelector(DateRangeDisplayMode) }
  ];
});

//================================================================================================================================================================================//

export const generalConfigSchema = memoizeOne((): any[] => {
  return [
    { key: GlobalOptions, name: GlobalOptions.Title, selector: { text: {} }, },
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
        { key: FlowsOptions, name: FlowsOptions.Animation, required: true, selector: dropdownSelector(AnimationMode) },
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

export const nodeConfigSchema = memoizeOne((entitySchema: any[] = [], secondaryEntities: string[]): any[] => {
  const result: Array<any> = [...entitySchema];

  result.push(
    {
      key: NodeOptions,
      name: NodeOptions.Overrides,
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
    secondaryInfoSchema(secondaryEntities)
  );

  return result;
});

//================================================================================================================================================================================//

export const singleValueNodeSchema = memoizeOne((schemaConfig: NodeConfig, page: EditorPages, deviceClasses: string[], isSolarNode: boolean = false): any[] => {
  return [
    {
      key: NodeOptions,
      page: page,
      name: NodeOptions.Import_Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: deviceClasses } } }
      ]
    },
    singleValueColourSchema(schemaConfig, page, isSolarNode)
  ];
});

//================================================================================================================================================================================//

export const singleValueColourSchema = memoizeOne((schemaConfig: NodeConfig, page: EditorPages, isSolarNode: boolean = false): {} => {
  return {
    key: NodeOptions,
    name: NodeOptions.Colours,
    type: SchemaTypes.Expandable,
    schema: [
      {
        type: SchemaTypes.Grid,
        schema: [
          ...colourSchema(
            schemaConfig,
            page,
            ColourOptions.Flow_Import,
            getDropdownValues(ColourMode, BASIC_COLOUR_MODES),
          ),
          ...colourSchema(
            schemaConfig,
            undefined,
            ColourOptions.Circle,
            isSolarNode
              ? getDropdownValues(ColourMode, [ColourMode.Dynamic, ...BASIC_COLOUR_MODES_SINGLE])
              : getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
          ),
          ...colourSchema(
            schemaConfig,
            page,
            ColourOptions.Value_Import,
            getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
          ),
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
        ]
      }
    ]
  };
});

//================================================================================================================================================================================//

export const dualValueNodeSchema = memoizeOne((schemaConfig: NodeConfig, page: EditorPages): any[] => {
  return [
    {
      key: NodeOptions,
      page: page,
      name: NodeOptions.Import_Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }
      ]
    },
    {
      key: NodeOptions,
      page: page,
      name: NodeOptions.Export_Entities,
      type: SchemaTypes.Expandable,
      schema: [
        { key: EntitiesOptions, name: EntitiesOptions.Entity_Ids, selector: { entity: { multiple: true, reorder: true, device_class: DeviceClasses.Energy } } }
      ]
    },
    {
      key: NodeOptions,
      name: NodeOptions.Colours,
      type: SchemaTypes.Expandable,
      schema: [
        {
          type: SchemaTypes.Grid,
          schema: [
            ...colourSchema(
              schemaConfig,
              page,
              ColourOptions.Flow_Import,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES)
            ),
            ...colourSchema(
              schemaConfig,
              page,
              ColourOptions.Flow_Export,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES)
            ),
            ...colourSchema(
              schemaConfig,
              undefined,
              ColourOptions.Circle,
              getDropdownValues(ColourMode, [ColourMode.Dynamic, ...BASIC_COLOUR_MODES_DUAL], page)
            ),
            ...colourSchema(
              schemaConfig,
              page,
              ColourOptions.Value_Import,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
            ),
            ...colourSchema(
              schemaConfig,
              page,
              ColourOptions.Value_Export,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES_SINGLE)
            ),
            ...colourSchema(
              schemaConfig,
              undefined,
              ColourOptions.Icon,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL, page)
            ),
            ...colourSchema(
              schemaConfig,
              undefined,
              ColourOptions.Secondary,
              getDropdownValues(ColourMode, BASIC_COLOUR_MODES_DUAL, page)
            )
          ]
        }
      ]
    }
  ];
});

//================================================================================================================================================================================//

export const colourSchema = memoizeOne((config: NodeConfig, page: EditorPages | undefined, name: ColourOptions, options: DropdownValue[]): any[] => {
  return [
    {
      key: ColourOptions,
      page: page,
      name: name,
      required: true,
      selector: {
        select: {
          mode: SelectorModes.Dropdown,
          options: options
        }
      }
    },
    getConfigValue(config, [NodeOptions.Colours, name]) === ColourMode.Custom ? { key: ColourOptions, page: page, name: name.replace("mode", "colour"), selector: { color_rgb: {} } } : {}
  ];
});

//================================================================================================================================================================================//

export const secondaryInfoSchema = memoizeOne((secondaryEntities: string[]): {} => {
  return {
    key: NodeOptions,
    name: NodeOptions.Secondary_Info,
    type: SchemaTypes.Expandable,
    schema: [
      { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Entity_Id, selector: { entity: { include_entities: secondaryEntities } } },
      {
        type: SchemaTypes.Grid,
        column_min_width: '150px',
        schema: [
          { key: SecondaryInfoOptions, name: SecondaryInfoOptions.Unit_Position, required: true, selector: dropdownSelector(UnitPosition) },
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

export const dropdownSelector = memoizeOne((type: any, page?: EditorPages): {} => {
  return { select: { mode: SelectorModes.Dropdown, options: getDropdownValues(type, [], page) } };
});

//================================================================================================================================================================================//

export function getDropdownValues<T>(type: T, values: string[] = [], page?: EditorPages): DropdownValue[] {
  const enumValues: string[] = Object.values(type as any);

  if (values.length === 0) {
    values = enumValues;
  } else {
    values = values.filter(value => enumValues.includes(value));
  }

  return values.map(value => {
    return {
      label: localize((type as any).name + "." + value + (page ? "." + page : ""), "") || localize((type as any).name + "." + value),
      value: value
    }
  });
}

//================================================================================================================================================================================//
