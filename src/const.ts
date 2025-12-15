export const CIRCLE_SIZE: number = 80;
export const CIRCLE_STROKE_WIDTH: number = 2;
export const CIRCLE_STROKE_WIDTH_SEGMENTS: number = CIRCLE_STROKE_WIDTH * 2;

export const DOT_RADIUS: number = 4.5;
export const FLOW_LINE_SPACING: number = DOT_RADIUS * 2 + 5;


export const CIRCLE_RADIUS: number = (CIRCLE_SIZE - CIRCLE_STROKE_WIDTH_SEGMENTS) / 2;
export const CIRCLE_CIRCUMFERENCE: number = CIRCLE_RADIUS * 2 * Math.PI;
export const CIRCLE_CENTRE: number = CIRCLE_SIZE / 2;
export const ROW_SPACING: number = CIRCLE_SIZE * 3 / 8;
export const COL_SPACING: number = CIRCLE_SIZE * 13 / 8;

// TODO: where does this really come from?
export const TEXT_LINE_HEIGHT: number = 19.2;

export const LINE_SCALE_HORIZONTAL: number = 103;
export const LINE_SCALE_VERTICAL: number = 106;

export const CARD_NAME: string = "energy-flow-card-ext";
export const DEVICE_CLASS_ENERGY = "energy";
export const DEVICE_CLASS_MONETARY = "monetary";
export const ENERGY_DATA_TIMEOUT: number = 10000;

export const STYLE_PRIMARY_TEXT_COLOR: string = "var(--primary-text-color)";
export const STYLE_DISABLED_TEXT_COLOR: string = "var(--disabled-text-color)";
export const STYLE_ENERGY_SOLAR_COLOR: string = "var(--energy-solar-color)";
export const STYLE_ENERGY_GAS_COLOR: string = "var(--energy-gas-color)";
export const STYLE_ENERGY_NON_FOSSIL_COLOR: string = "var(--energy-non-fossil-color)";
export const STYLE_ENERGY_BATTERY_IMPORT_COLOR: string = "var(--energy-battery-out-color)";
export const STYLE_ENERGY_BATTERY_EXPORT_COLOR: string = "var(--energy-battery-in-color)";
export const STYLE_ENERGY_GRID_IMPORT_COLOR: string = "var(--energy-grid-consumption-color)";
export const STYLE_ENERGY_GRID_EXPORT_COLOR: string = "var(--energy-grid-return-color)";
