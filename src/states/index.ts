export interface BiDiState {
  import: number;
  export: number;
}

export interface Flows {
  solarToHome: number;
  solarToGrid: number;
  solarToBattery: number;
  gridToHome: number;
  gridToBattery: number;
  batteryToHome: number;
  batteryToGrid: number;
}

export interface States {
  largestElectricValue: number;
  largestGasValue: number;
  battery: BiDiState;
  batterySecondary: number;
  gasImport: number;
  gasImportVolume: number;
  gasSecondary: number;
  grid: BiDiState;
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
  devices: BiDiState[];
  devicesVolume: BiDiState[];
  devicesSecondary: number[];
  flows: Flows;
}
