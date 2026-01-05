import { EnergyFlowCardExtConfig, GasConfig, HomeConfig, LowCarbonConfig, SolarConfig } from "@/config";
import { getDefaultConfig, getDefaultGasConfig, getDefaultHomeConfig, getDefaultLowCarbonConfig, getDefaultSolarConfig } from "@/config/config";

export const CIRCLE_STROKE_WIDTH: number = 2;
export const CIRCLE_STROKE_WIDTH_SEGMENTS: number = CIRCLE_STROKE_WIDTH * 2;

export const ICON_PADDING: number = 2;

export const DOT_RADIUS: number = 4.5;

export const CARD_NAME: string = "energy-flow-card-ext";
export const DEVICE_CLASS_ENERGY: string = "energy";
export const DEVICE_CLASS_GAS: string = "gas";
export const DEVICE_CLASS_MONETARY: string = "monetary";

export const ELECTRIC_ENTITY_CLASSES: string[] = [DEVICE_CLASS_ENERGY];
export const GAS_ENTITY_CLASSES: string[] = [DEVICE_CLASS_ENERGY, DEVICE_CLASS_GAS];

export const DEFAULT_CONFIG: EnergyFlowCardExtConfig = getDefaultConfig();
export const DEFAULT_GAS_CONFIG: GasConfig = getDefaultGasConfig()!;
export const DEFAULT_SOLAR_CONFIG: SolarConfig = getDefaultSolarConfig()!;
export const DEFAULT_LOW_CARBON_CONFIG: LowCarbonConfig = getDefaultLowCarbonConfig();
export const DEFAULT_HOME_CONFIG: HomeConfig = getDefaultHomeConfig();
