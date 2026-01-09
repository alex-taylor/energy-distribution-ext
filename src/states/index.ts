import { EntitiesOptions, OverridesOptions } from "@/config";
import { getConfigValue } from "@/config/config";

export interface Flows {
  solarToHome: number;
  solarToGrid: number;
  solarToBattery: number;
  gridToHome: number;
  gridToBattery: number;
  batteryToHome: number;
  batteryToGrid: number;
};

export interface States {
  largestElectricValue: number;
  largestGasValue: number;
  batteryImport: number;
  batteryExport: number;
  batterySecondary: number;
  gasImport: number;
  gasImportVolume: number;
  gasSecondary: number;
  gridImport: number;
  gridExport: number;
  gridSecondary: number;
  highCarbon: number;
  homeElectric: number;
  homeGas: number;
  homeGasVolume: number;
  homeSecondary: number;
  lowCarbon: number;
  lowCarbonPercentage: number;
  lowCarbonSecondary: number;
  solarImport: number;
  solarSecondary: number;
  devices: number[];
  devicesSecondary: any[];
  flows: Flows;
};

export abstract class State {
  public isPresent: boolean;
  public hassConfigPresent: boolean = false;
  public icon: string;
  public importEntities: string[];
  public rawEntities: string[] = [];
  public firstImportEntity?: string;

  protected constructor(config: any[], importEntities: string[], defaultIcon: string) {
    this.importEntities = importEntities;
    this.isPresent = importEntities.length !== 0;
    this.firstImportEntity = this.isPresent ? importEntities[0] : undefined;
    this.icon = getConfigValue(config, [EntitiesOptions.Overrides, OverridesOptions.Icon]) || defaultIcon;
  }
}
