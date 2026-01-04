import { HomeAssistant } from "custom-card-helpers";
import { EntitiesOptions, OverridesOptions } from "@/config";

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
  gasSecondary: number;
  gridImport: number;
  gridExport: number;
  gridSecondary: number;
  highCarbon: number;
  homeElectric: number;
  homeGas: number;
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
  public icon: string;
  public mainEntities: string[];
  public firstImportEntity?: string;

  protected constructor(hass: HomeAssistant, config: any, mainEntities: string[] = [], defaultIcon: string) {
    this.mainEntities = mainEntities;
    this.isPresent = mainEntities.length !== 0;
    this.firstImportEntity = this.isPresent ? mainEntities[0] : undefined;
    this.icon = config?.[EntitiesOptions.Overrides]?.[OverridesOptions.Icon] || defaultIcon;
  }
}
