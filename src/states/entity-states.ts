import { HomeAssistant } from "custom-card-helpers";
import { HassEntity, UnsubscribeFunc } from "home-assistant-js-websocket";
import { EnergyCollection, EnergyData, EnergyPreferences, EnergySource, Statistics, StatisticValue } from "@/hass";
import { AppearanceOptions, DeviceConfig, EditorPages, EnergyDistributionExtConfig, EnergyUnitsConfig, EnergyUnitsOptions, FlowsOptions, GlobalOptions, NodeConfig } from "@/config";
import { BatteryNode } from "@/nodes/battery";
import { GasNode } from "@/nodes/gas";
import { HomeNode } from "@/nodes/home";
import { LowCarbonNode } from "@/nodes/low-carbon";
import { SolarNode } from "@/nodes/solar";
import { DeviceNode } from "@/nodes/device";
import { addDays, addHours, differenceInDays, endOfToday, isFirstDayOfMonth, isLastDayOfMonth, startOfDay } from "date-fns";
import { EnergyUnits, SIUnitPrefixes, VolumeUnits, checkEnumValue, DateRange, EnergyType, DeviceClasses, EnergyDirection, DisplayMode, StateClasses } from "@/enums";
import { LOGGER } from "@/logging";
import { getEnergyDataCollection, getEnergyPreferences } from "@/energy";
import { BiDiState, Flows, States } from "@/nodes";
import { UNIT_CONVERSIONS } from "./unit-conversions";
import { DEFAULT_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";
import { calculateDateRange } from "@/dates";
import { Node } from "@/nodes/node";
import { GridNode } from "@/nodes/grid";
import { POWER_UNITS } from "@/const";

//================================================================================================================================================================================//

const ENERGY_DATA_TIMEOUT: number = 10000;
const ENERGY_DATA_POLL: number = 100;

const Direction = {
  Normal: 0,
  Reverse: 1,
  Secondary: 2
} as const;

type Direction = typeof Direction[keyof typeof Direction];

const Period = {
  Hour: "hour",
  Day: "day",
  Month: "month"
} as const;

type Period = typeof Period[keyof typeof Period];

export const DataStatus = {
  Received: "Received",
  Requested: "Requested",
  Timed_Out: "Timed out",
  Unavailable: "Unavailable"
} as const;

export type DataStatus = typeof DataStatus[keyof typeof DataStatus];

//================================================================================================================================================================================//

export class EntityStates {
  public hass: HomeAssistant;

  public get isDatePickerPresent(): boolean {
    return this._isDatePickerPresent;
  }

  private _isDatePickerPresent: boolean = false;

  public get isDataPresent(): DataStatus {
    return this._dataStatus;
  }

  private _dataStatus: DataStatus = DataStatus.Requested;

  public get isConfigPresent(): boolean {
    return this._isConfigPresent;
  }

  private _isConfigPresent: boolean = false;

  public get periodStart(): Date | undefined {
    return this._periodStart;
  }

  private _periodStart: Date | undefined = undefined;

  public get periodEnd(): Date | undefined {
    return this._periodEnd;
  }

  private _periodEnd: Date | undefined = undefined;

  public get battery(): BatteryNode {
    return this._battery;
  }

  private _battery!: BatteryNode;

  public get gas(): GasNode {
    return this._gas;
  }

  private _gas!: GasNode;

  public get grid(): GridNode {
    return this._grid;
  }

  private _grid!: GridNode;

  public get home(): HomeNode {
    return this._home;
  }

  private _home!: HomeNode;

  public get lowCarbon(): LowCarbonNode {
    return this._lowCarbon;
  }

  private _lowCarbon!: LowCarbonNode;

  public get solar(): SolarNode {
    return this._solar;
  }

  private _solar!: SolarNode;

  public get devices(): DeviceNode[] {
    return this._devices;
  }

  private _devices!: DeviceNode[];

  private _states: States = {
    electricPresent: false,
    gasPresent: false,
    largestElectricValue: 0,
    largestGasValue: 0,
    battery: { import: 0, export: 0 },
    batterySecondary: 0,
    gasImport: 0,
    gasImportVolume: 0,
    gasSecondary: 0,
    grid: { import: 0, export: 0 },
    gridSecondary: 0,
    highCarbon: 0,
    homeElectric: 0,
    homeGas: 0,
    homeGasVolume: 0,
    homeSecondary: 0,
    lowCarbon: 0,
    lowCarbonPercentage: 0,
    lowCarbonSecondary: 0,
    solarImport: 0,
    solarSecondary: 0,
    devicesElectric: [],
    devicesGas: [],
    devicesGasVolume: [],
    devicesSecondary: [],
    flows: {
      solarToHome: 0,
      solarToGrid: 0,
      solarToBattery: 0,
      gridToHome: 0,
      gridToBattery: 0,
      batteryToHome: 0,
      batteryToGrid: 0
    }
  };

  private readonly _mode: DisplayMode;
  private readonly _dateRange: DateRange;
  private readonly _dateRangeLive: boolean;
  private _primaryEntityIds: string[] = [];
  private _secondaryEntityIds: string[] = [];
  private _primaryStatistics?: Statistics;
  private _secondaryStatistics?: Statistics;
  private _co2data?: Record<string, number>;
  private readonly _energyUnits: string;
  private readonly _gasUnits: string;
  private readonly _volumeUnits: string;
  private readonly _gasCalorificValue: number;
  private readonly _useHourlyStats: boolean;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, config: EnergyDistributionExtConfig) {
    const configs: EnergyDistributionExtConfig[] = [config, DEFAULT_CONFIG];

    this.hass = hass;
    this._mode = getConfigValue(configs, GlobalOptions.Mode);

    const energyUnitsConfig: EnergyUnitsConfig[] = getConfigObjects(configs, [EditorPages.Appearance, AppearanceOptions.Energy_Units]);
    this._gasCalorificValue = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Calorific_Value);

    if (this._mode === DisplayMode.Power) {
      this._dateRange = DateRange.Today;
      this._dateRangeLive = true;
      this._energyUnits = this._gasUnits = this._volumeUnits = POWER_UNITS;
      this._dataStatus = DataStatus.Received;
      this._useHourlyStats = false;
    } else {
      this._dateRange = getConfigValue(configs, GlobalOptions.Date_Range, value => checkEnumValue(value, DateRange));
      this._dateRangeLive = getConfigValue(configs, GlobalOptions.Date_Range_Live);
      this._energyUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Electric_Units, value => checkEnumValue(value, EnergyUnits));
      this._gasUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Units, value => checkEnumValue(value, VolumeUnits));
      this._volumeUnits = this._gasUnits === VolumeUnits.Same_As_Electric ? VolumeUnits.Cubic_Metres : this._gasUnits;
      this._useHourlyStats = getConfigValue(configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Use_Hourly_Stats]);
    }
  }

  //================================================================================================================================================================================//

  public getStates(): States | undefined {
    if (this.isDataPresent !== DataStatus.Received) {
      return undefined;
    }

    const states: States = structuredClone(this._states);
    this._addStateDeltas(states);

    states.lowCarbon = this.lowCarbon.isPresent ? states.grid.import - states.highCarbon : 0;
    states.lowCarbonPercentage = (states.lowCarbon / states.grid.import) * 100;

    this._calculateHomeTotals(states);
    this._rescaleFlows(states);

    return states;
  }

  //================================================================================================================================================================================//

  public async subscribe(cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration): Promise<UnsubscribeFunc> {
    await this._loadConfig(this.hass, cardConfig, style);

    if (this._mode === DisplayMode.Power) {
      return (): void => {
      };
    }

    if (this._dateRange === DateRange.From_Date_Picker) {
      const pollStartTime: number = Date.now();

      const getEnergyDataCollectionPoll = (resolve: (value: EnergyCollection) => void, reject: (reason: Error) => void) => {
        const energyCollection = getEnergyDataCollection(this.hass);

        if (energyCollection) {
          this._isDatePickerPresent = true;
          resolve(energyCollection);
        } else if (Date.now() - pollStartTime > ENERGY_DATA_TIMEOUT) {
          reject(new Error(`No energy data received after ${ENERGY_DATA_TIMEOUT}ms. Is there a type:energy-date-selection card on this screen?`));
        } else {
          setTimeout(() => getEnergyDataCollectionPoll(resolve, reject), ENERGY_DATA_POLL);
        }
      };

      return new Promise<EnergyCollection>(getEnergyDataCollectionPoll)
        .then(async (collection: EnergyCollection) => collection.subscribe(async (data: EnergyData) => {
          await this._loadStatistics(data.start, data.end || endOfToday());
        }))
        .catch(err => {
          LOGGER.debug(err);
          return (): void => {
          };
        });
    }

    let refresh: NodeJS.Timeout;

    const loadStatistics = () => {
      const nextFetch: Date = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      // eslint-disable-next-line prefer-const
      [periodStart, periodEnd] = calculateDateRange(this.hass, this._dateRange);

      this._loadStatistics(periodStart, periodEnd);

      if (nextFetch.getMinutes() >= 20) {
        if (nextFetch.getHours() === 23) {
          nextFetch.setMinutes(0, 0, 0);
        } else {
          nextFetch.setMinutes(20, 0, 0);
        }

        nextFetch.setHours(nextFetch.getHours() + 1);
      } else {
        nextFetch.setMinutes(20, 0, 0);
      }

      refresh = setTimeout(() => loadStatistics(), nextFetch.getTime() - Date.now());
    };

    loadStatistics();
    return (): void => clearTimeout(refresh);
  }

  //================================================================================================================================================================================//

  private async _loadConfig(hass: HomeAssistant, cardConfig: EnergyDistributionExtConfig, style: CSSStyleDeclaration): Promise<void> {
    const configs: EnergyDistributionExtConfig[] = [cardConfig, DEFAULT_CONFIG];
    let energySources: EnergySource[] = [];

    if (getConfigValue(configs, GlobalOptions.Use_HASS_Config)) {
      const prefs: EnergyPreferences = await getEnergyPreferences(hass);
      energySources = prefs?.energy_sources || [];
    }

    this._battery = new BatteryNode(hass, cardConfig, style, energySources);
    this._gas = new GasNode(hass, cardConfig, style, energySources);
    this._grid = new GridNode(hass, cardConfig, style, energySources);
    this._home = new HomeNode(hass, cardConfig, style);
    this._lowCarbon = new LowCarbonNode(hass, cardConfig, style);
    this._solar = new SolarNode(hass, cardConfig, style, energySources);

    const deviceConfigs: DeviceConfig[] = getConfigValue(configs, EditorPages.Devices) || [];
    this._devices = deviceConfigs.flatMap((_, index) => new DeviceNode(hass, cardConfig, style, index));

    this._populateEntityArrays();
    this._clearStates();
    this._isConfigPresent = true;
  }

  //================================================================================================================================================================================//

  private _addStateDeltas(states: States): void {
    if (!this._dateRangeLive) {
      return;
    }

    const primaryStatistics: Statistics = this._primaryStatistics!;
    const secondaryStatistics: Statistics = this._secondaryStatistics!;
    const energyUnits: string = this._energyUnits;
    const volumeUnits: string = this._volumeUnits;

    const solarImportDelta: number = this._getStateDelta(Direction.Normal, primaryStatistics, this.solar.importEntities, energyUnits);
    const batteryImportDelta: number = this._getStateDelta(Direction.Normal, primaryStatistics, this.battery.importEntities, energyUnits);
    const batteryExportDelta: number = this._getStateDelta(Direction.Reverse, primaryStatistics, this.battery.exportEntities, energyUnits);
    const gridImportDelta: number = this._getStateDelta(Direction.Normal, primaryStatistics, this.grid.importEntities, energyUnits);
    const gridExportDelta: number = this._getStateDelta(Direction.Reverse, primaryStatistics, this.grid.exportEntities, energyUnits);
    states.battery.import += batteryImportDelta;
    states.battery.export += batteryExportDelta;
    states.grid.import += gridImportDelta;
    states.grid.export += gridExportDelta;
    states.solarImport += solarImportDelta;

    this.devices.forEach((device, index) => {
      if (device.type === EnergyType.Gas) {
        if (device.direction !== EnergyDirection.Consumer_Only) {
          states.devicesGas[index].import += this._getStateDelta(Direction.Normal, primaryStatistics, device.importEntities, energyUnits);
          states.devicesGasVolume[index].import += this._getStateDelta(Direction.Normal, primaryStatistics, device.importEntities, volumeUnits);
        }

        if (device.direction !== EnergyDirection.Producer_Only) {
          if (this._mode === DisplayMode.Power) {
            states.devicesGas[index].export -= this._getStateDelta(Direction.Normal, primaryStatistics, device.exportEntities, energyUnits);
            states.devicesGasVolume[index].export -= this._getStateDelta(Direction.Normal, primaryStatistics, device.exportEntities, volumeUnits);
          } else {
            states.devicesGas[index].export += this._getStateDelta(Direction.Reverse, primaryStatistics, device.exportEntities, energyUnits);
            states.devicesGasVolume[index].export += this._getStateDelta(Direction.Reverse, primaryStatistics, device.exportEntities, volumeUnits);
          }
        }
      } else {
        switch (device.direction) {
          case EnergyDirection.Producer_Only:
            states.devicesElectric[index].import += this._getStateDelta(Direction.Normal, primaryStatistics, device.importEntities, energyUnits);
            break;

          case EnergyDirection.Consumer_Only:
            if (this._mode === DisplayMode.Power) {
              states.devicesElectric[index].export += this._getStateDelta(Direction.Normal, primaryStatistics, device.exportEntities, energyUnits);
            } else {
              states.devicesElectric[index].export += this._getStateDelta(Direction.Reverse, primaryStatistics, device.exportEntities, energyUnits);
            }
            break;

          case EnergyDirection.Both:
            states.devicesElectric[index].import += this._getStateDelta(Direction.Normal, primaryStatistics, device.importEntities, energyUnits);
            states.devicesElectric[index].export += this._getStateDelta(Direction.Reverse, primaryStatistics, device.exportEntities, energyUnits);
            break;
        }
      }

      states.devicesSecondary[index] += this._getStateDelta(Direction.Normal, secondaryStatistics, device.secondary.entity);
    });

    states.gasImport += this._getStateDelta(Direction.Normal, primaryStatistics, this.gas.importEntities, energyUnits);
    states.gasImportVolume += this._getStateDelta(Direction.Normal, primaryStatistics, this.gas.importEntities, volumeUnits);

    const highCarbonDelta: number = this.lowCarbon.isPresent ? gridImportDelta * Number(this.hass.states[this.lowCarbon.firstImportEntity!].state) / 100 : 0;
    states.highCarbon += highCarbonDelta;

    states.batterySecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.battery.secondary.entity);
    states.gasSecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.gas.secondary.entity);
    states.gridSecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.grid.secondary.entity);
    states.homeSecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.home.secondary.entity);
    states.lowCarbonSecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.lowCarbon.secondary.entity);
    states.solarSecondary += this._getStateDelta(Direction.Secondary, secondaryStatistics, this.solar.secondary.entity);

    const flowDeltas: Flows = this._calculateFlows(solarImportDelta, batteryImportDelta, batteryExportDelta, gridImportDelta, gridExportDelta);
    states.flows.batteryToGrid += flowDeltas.batteryToGrid;
    states.flows.solarToGrid += flowDeltas.solarToGrid;
    states.flows.gridToBattery += flowDeltas.gridToBattery;
    states.flows.solarToBattery += flowDeltas.solarToBattery;
    states.flows.batteryToHome += flowDeltas.batteryToHome;
    states.flows.gridToHome += flowDeltas.gridToHome;
    states.flows.solarToHome += flowDeltas.solarToHome;
  }

  //================================================================================================================================================================================//

  private _getStateDelta(direction: Direction, statistics: Statistics, entityIds: string[] | string | undefined = [], requestedUnits?: string): number {
    if (typeof entityIds === "string") {
      entityIds = [entityIds];
    }

    if (entityIds.length === 0) {
      return 0;
    }

    let deltaSum: number = 0;

    if (this._mode === DisplayMode.Power) {
      entityIds.forEach(entityId => {
        const stateObj: HassEntity = this.hass.states[entityId];

        if (stateObj) {
          deltaSum += this._toBaseUnits(Number(stateObj.state), stateObj.attributes.unit_of_measurement, requestedUnits);
        }
      });

      if (direction === Direction.Reverse) {
        if (deltaSum < 0) {
          deltaSum = -deltaSum;
        } else {
          deltaSum = 0;
        }
      } else if (direction === Direction.Normal && deltaSum < 0) {
        deltaSum = 0;
      }
    } else {
      const periodStart: number = this._periodStart!.getTime();
      const periodEnd: number = this._periodEnd!.getTime();

      entityIds.forEach(entityId => {
        const stateObj: HassEntity = this.hass.states[entityId];

        if (stateObj) {
          const lastChanged: number = Date.parse(stateObj.last_changed);

          if (lastChanged >= periodStart && lastChanged <= periodEnd) {
            const entityStats: StatisticValue[] = statistics[entityId];
            const lastStat: StatisticValue = entityStats[entityStats.length - 1];
            const units: string | undefined = stateObj.attributes.unit_of_measurement;
            const state: number = Number(stateObj.state);
            const lastState: number = lastStat.state ?? 0;
            let delta: number = state - lastState;

            if (delta < 0 && stateObj.attributes.state_class === StateClasses.Total_Increasing) {
              // a total_increasing sensor can only have a negative delta following a reset event
              delta = 0;
            }

            deltaSum += this._toBaseUnits(delta, units, requestedUnits);
          }
        }
      });
    }

    return deltaSum;
  }

  //================================================================================================================================================================================//

  private _isRollover(periodStart: Date): boolean {
    return periodStart === addDays(startOfDay(this.periodEnd!), 1);
  }

  //================================================================================================================================================================================//

  private _clearStates(): void {
    if (this._mode !== DisplayMode.Power) {
      this._dataStatus = DataStatus.Unavailable;
    }

    this._states = {
      electricPresent: this.battery.isPresent || this.grid.isPresent || this.solar.isPresent,
      gasPresent: this.gas.isPresent,
      largestElectricValue: 0,
      largestGasValue: 0,
      battery: { import: 0, export: 0 },
      batterySecondary: 0,
      gasImport: 0,
      gasImportVolume: 0,
      gasSecondary: 0,
      grid: { import: 0, export: 0 },
      gridSecondary: 0,
      highCarbon: 0,
      homeElectric: 0,
      homeGas: 0,
      homeGasVolume: 0,
      homeSecondary: 0,
      lowCarbon: 0,
      lowCarbonPercentage: 0,
      lowCarbonSecondary: 0,
      solarImport: 0,
      solarSecondary: 0,
      devicesElectric: [],
      devicesGas: [],
      devicesGasVolume: [],
      devicesSecondary: [],
      flows: {
        solarToHome: 0,
        solarToGrid: 0,
        solarToBattery: 0,
        gridToHome: 0,
        gridToBattery: 0,
        batteryToHome: 0,
        batteryToGrid: 0
      }
    };

    this.devices.forEach((device, index) => {
      if (device.type === EnergyType.Electric) {
        this._states.electricPresent = true;
      } else {
        this._states.gasPresent = true;
      }

      this._states.devicesElectric[index] = { export: 0, import: 0 };
      this._states.devicesGas[index] = { export: 0, import: 0 };
      this._states.devicesGasVolume[index] = { export: 0, import: 0 };
      this._states.devicesSecondary[index] = 0;
    });
  }

  //================================================================================================================================================================================//

  private async _loadStatistics(periodStart: Date, periodEnd: Date): Promise<void> {
    if (this._primaryEntityIds.length !== 0 || this._secondaryEntityIds.length !== 0) {
      // if the new period follows directly on from the current one, do not set the 'requested' flag as this will cause the display to show "Loading...", which is unnecessary
      if (!this._isRollover(periodStart) && (periodStart !== this.periodStart || periodEnd !== this.periodEnd)) {
        this._primaryStatistics = undefined;
        this._secondaryStatistics = undefined;
        this._dataStatus = DataStatus.Requested;
      }

      const timeout: NodeJS.Timeout = setTimeout(() => {
          this._dataStatus = DataStatus.Timed_Out;
          LOGGER.debug(`No energy statistics received after ${ENERGY_DATA_TIMEOUT * 2}ms`);
        },
        ENERGY_DATA_TIMEOUT * 2
      );

      const primaries: string[] = this._primaryEntityIds;
      const secondaries: string[] = this._secondaryEntityIds;
      const fetchStartTime: number = Date.now();
      const dayDiff: number = differenceInDays(periodEnd, periodStart);
      const period: Period = isFirstDayOfMonth(periodStart) && isLastDayOfMonth(periodEnd) && dayDiff > 35 ? Period.Month : dayDiff > 2 ? Period.Day : Period.Hour;
      const primaryPeriod: Period = this._useHourlyStats ? Period.Hour : period;

      const [previousPrimaryData, primaryData, co2data, previousSecondaryData, secondaryData] = await Promise.all([
        this._fetchStatistics(addHours(periodStart, -1), periodStart, primaries, Period.Hour),
        this._fetchStatistics(periodStart, periodEnd, primaries, primaryPeriod),
        this.lowCarbon.isPresent ? this._fetchCo2Data(periodStart, periodEnd, primaryPeriod) : Promise.resolve(),
        secondaries.length !== 0 ? this._fetchStatistics(addHours(periodStart, -1), periodStart, secondaries, Period.Hour) : Promise.resolve(),
        secondaries.length !== 0 ? this._fetchStatistics(periodStart, periodEnd, secondaries, period) : Promise.resolve()
      ]);

      clearTimeout(timeout);

      this._co2data = co2data || undefined;

      let primaryDataProcessed: boolean = false;
      let secondaryDataProcessed: boolean = false;

      this._clearStates();

      if (primaryData && Object.keys(primaryData).length !== 0) {
        this._prepStatistics(primaries, primaryData, previousPrimaryData, periodStart, periodEnd);
        this._primaryStatistics = primaryData;
        this._calculatePrimaryStatistics();
        primaryDataProcessed = true;
      }

      if (secondaryData && Object.keys(secondaryData).length !== 0) {
        this._prepStatistics(secondaries, secondaryData, previousSecondaryData!, periodStart, periodEnd);
        this._secondaryStatistics = secondaryData;
        this._calculateSecondaryStatistics();
        secondaryDataProcessed = true;
      }

      if (primaryDataProcessed || secondaryDataProcessed) {
        LOGGER.debug(`Received per-${primaryPeriod} stats (primary${this.lowCarbon.isPresent ? ", low-carbon" : ""}${secondaries.length !== 0 ? ", secondary" : ""}) for period [${periodStart.toISOString()} - ${periodEnd.toISOString()}] in ${Date.now() - fetchStartTime}ms`);
        this._dataStatus = DataStatus.Received;
      } else {
        LOGGER.debug(`Stats not available for period [${periodStart.toISOString()} - ${periodEnd.toISOString()}]`);
        const now: number = Date.now();

        if (this._dateRangeLive && now >= periodStart.getTime() && now <= periodEnd.getTime()) {
          this._dataStatus = DataStatus.Received;
        }
      }
    }

    this._periodStart = periodStart;
    this._periodEnd = periodEnd;
  }

  //================================================================================================================================================================================//

  private _calculatePrimaryStatistics(): void {
    const statistics: Statistics | undefined = this._primaryStatistics;

    if (!statistics) {
      return;
    }

    const states: States = this._states;
    const combinedStats: Map<number, Map<string, number>> = new Map();

    if (this.grid.isPresent && !this._isPowerOutage()) {
      this._addFlowStats(statistics, combinedStats, this.grid.importEntities, this._energyUnits);
      this._addFlowStats(statistics, combinedStats, this.grid.exportEntities, this._energyUnits);
    }

    if (this.battery.isPresent) {
      this._addFlowStats(statistics, combinedStats, this.battery.importEntities, this._energyUnits);
      this._addFlowStats(statistics, combinedStats, this.battery.exportEntities, this._energyUnits);
    }

    if (this.solar.isPresent) {
      this._addFlowStats(statistics, combinedStats, this.solar.importEntities, this._energyUnits);
    }

    let solarToHome: number = 0;
    let gridToHome: number = 0;
    let gridToBattery: number = 0;
    let batteryToGrid: number = 0;
    let batteryToHome: number = 0;
    let solarToBattery: number = 0;
    let solarToGrid: number = 0;
    let solarProduction: number = 0;
    let gridImport: number = 0;
    let gridExport: number = 0;
    let batteryImport: number = 0;
    let batteryExport: number = 0;

    combinedStats.forEach(entry => {
      const sp: number = this._getMainFlowEntityStates(entry, this.solar.importEntities);
      const bi: number = this._getMainFlowEntityStates(entry, this.battery.importEntities);
      const be: number = this._getMainFlowEntityStates(entry, this.battery.exportEntities);
      const gi: number = this._getMainFlowEntityStates(entry, this.grid.importEntities);
      const ge: number = this._getMainFlowEntityStates(entry, this.grid.exportEntities);
      solarProduction += sp;
      gridImport += gi;
      gridExport += ge;
      batteryImport += bi;
      batteryExport += be;

      const flows: Flows = this._calculateFlows(sp, bi, be, gi, ge);
      solarToHome += flows.solarToHome;
      gridToHome += flows.gridToHome;
      gridToBattery += flows.gridToBattery;
      batteryToGrid += flows.batteryToGrid;
      batteryToHome += flows.batteryToHome;
      solarToBattery += flows.solarToBattery;
      solarToGrid += flows.solarToGrid;
    });

    const flows: Flows = states.flows;

    if (this.grid.isPresent) {
      if (this._isPowerOutage()) {
        this.grid.powerOutage.isOutage = true;
        states.grid.import = 0;
        states.grid.export = 0;
        flows.batteryToGrid = 0;
        flows.solarToGrid = 0;
        states.highCarbon = 0;
        flows.gridToHome = 0;
      } else {
        this.grid.powerOutage.isOutage = false;
        states.grid.import = gridImport;
        states.grid.export = gridExport;

        if (this.battery.isPresent) {
          flows.batteryToGrid = batteryToGrid;
        }

        if (this.solar.isPresent) {
          flows.solarToGrid = solarToGrid;
        }

        if (this.lowCarbon.isPresent && this._co2data) {
          states.highCarbon = this._toBaseUnits(Object.values(this._co2data).reduce((sum, a) => sum + a, 0), SIUnitPrefixes.Kilo + EnergyUnits.WattHours, this._energyUnits);
        } else {
          states.highCarbon = states.grid.import;
        }

        flows.gridToHome = gridToHome;
      }
    } else {
      flows.gridToHome = 0;
    }

    if (this.battery.isPresent) {
      states.battery.import = batteryImport;
      states.battery.export = batteryExport;

      if (this.grid.isPresent) {
        flows.gridToBattery = gridToBattery;
      }

      if (this.solar.isPresent) {
        flows.solarToBattery = solarToBattery;
      }

      flows.batteryToHome = batteryToHome;
    } else {
      flows.batteryToHome = 0;
    }

    if (this.solar.isPresent) {
      states.solarImport = solarProduction;
      flows.solarToHome = solarToHome;
    } else {
      flows.solarToHome = 0;
    }

    if (this.gas.isPresent) {
      states.gasImport = this._getHomeFlowEntityStates(this.gas.importEntities, this._energyUnits);
      states.gasImportVolume = this._getHomeFlowEntityStates(this.gas.importEntities, this._volumeUnits);
    } else {
      states.gasImport = 0;
      states.gasImportVolume = 0;
    }

    this.devices.forEach((device, index) => {
      states.devicesElectric[index] = { export: 0, import: 0 };
      states.devicesGas[index] = { export: 0, import: 0 };
      states.devicesGasVolume[index] = { export: 0, import: 0 };

      if (device.type === EnergyType.Gas) {
        if (device.direction !== EnergyDirection.Consumer_Only) {
          states.devicesGas[index].import = this._getHomeFlowEntityStates(device.importEntities, this._energyUnits);
          states.devicesGasVolume[index].import = this._getHomeFlowEntityStates(device.importEntities, this._volumeUnits);
        }

        if (device.direction !== EnergyDirection.Producer_Only) {
          states.devicesGas[index].export = this._getHomeFlowEntityStates(device.exportEntities, this._energyUnits);
          states.devicesGasVolume[index].export = this._getHomeFlowEntityStates(device.exportEntities, this._volumeUnits);
        }
      } else {
        if (device.direction !== EnergyDirection.Consumer_Only) {
          states.devicesElectric[index].import = this._getHomeFlowEntityStates(device.importEntities, this._energyUnits);
        }

        if (device.direction !== EnergyDirection.Producer_Only) {
          states.devicesElectric[index].export = this._getHomeFlowEntityStates(device.exportEntities, this._energyUnits);
        }
      }
    });
  }

  //================================================================================================================================================================================//

  private _calculateSecondaryStatistics(): void {
    if (!this._secondaryStatistics) {
      return;
    }

    const states: States = this._states;

    states.batterySecondary = this._getSecondaryStatistic(this.battery);
    states.gasSecondary = this._getSecondaryStatistic(this.gas);
    states.gridSecondary = this._getSecondaryStatistic(this.grid);
    states.homeSecondary = this._getSecondaryStatistic(this.home);
    states.lowCarbonSecondary = this._getSecondaryStatistic(this.lowCarbon);
    states.solarSecondary = this._getSecondaryStatistic(this.solar);
    this.devices.forEach((device, index) => states.devicesSecondary[index] = this._getSecondaryStatistic(device));
  }

  //================================================================================================================================================================================//

  private _getSecondaryStatistic(node: Node<NodeConfig>): number {
    if (!node.secondary.isPresent) {
      return 0;
    }

    const entityId: string = node.secondary.entity!;
    const deviceClass: string | undefined = this.hass.states[entityId].attributes.device_class;
    const requestedUnits: string | undefined = deviceClass === DeviceClasses.Energy ? this._energyUnits : undefined;
    return this._getEntityStatesFromStatistics(this._secondaryStatistics!, entityId, undefined, requestedUnits);
  }

  //================================================================================================================================================================================//

  private _addFlowStats(statistics: Statistics, combinedStats: Map<number, Map<string, number>>, entityIds: string[] | undefined = [], requestedUnits: string): void {
    if (entityIds.length === 0) {
      return;
    }

    entityIds.forEach(entityId => {
      const entityStats: Map<number, number> = this._getEntityStatistics(this.hass, statistics, entityId, requestedUnits);

      entityStats.forEach((value, timestamp) => {
        let entry: Map<string, number> | undefined = combinedStats.get(timestamp);

        if (!entry) {
          entry = new Map();
        }

        entry.set(entityId, value);
        combinedStats.set(timestamp, entry);
      });
    });
  }

  //================================================================================================================================================================================//

  private _getMainFlowEntityStates(entry: Map<string, number>, entityIds: string[] | undefined = []): number {
    if (entityIds.length === 0) {
      return 0;
    }

    let stateSum: number = 0;
    entityIds.forEach(entityId => stateSum += entry.get(entityId) ?? 0);
    return stateSum;
  }

  //================================================================================================================================================================================//

  private _getHomeFlowEntityStates(entityIds: string[] | undefined = [], requestedUnits: string): number {
    let stateSum: number = 0;
    entityIds.forEach(entityId => stateSum += this._getEntityStatesFromStatistics(this._primaryStatistics!, entityId, undefined, requestedUnits));
    return stateSum;
  }

  //================================================================================================================================================================================//

  private _getEntityStatesFromStatistics(statistics: Statistics, entityId: string, units: string | undefined, requestedUnits?: string): number {
    const entityStats: StatisticValue[] = statistics[entityId];

    if (entityStats.length !== 0) {
      const state: number = entityStats.map(stat => stat.change ?? 0).reduce((result, change) => result + change, 0) ?? 0;
      units = units || this.hass.states[entityId].attributes.unit_of_measurement;
      return this._toBaseUnits(state, units, requestedUnits || units);
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _calculateFlows(fromSolar: number, fromBattery: number, toBattery: number, fromGrid: number, toGrid: number): Flows {
    const energyIn: number = fromGrid + fromSolar + fromBattery;
    const energyOut: number = toGrid + toBattery;
    let remaining: number = Math.max(0, energyIn - energyOut);

    if (this._isPowerOutage()) {
      fromGrid = 0;
      toGrid = 0;
    }

    const excess: number = Math.max(0, Math.min(toBattery, fromGrid - remaining));
    let gridToBattery: number = excess;
    toBattery -= excess;
    fromGrid -= excess;

    const solarToBattery: number = Math.min(fromSolar, toBattery);
    toBattery -= solarToBattery;
    fromSolar -= solarToBattery;

    const solarToGrid: number = Math.min(fromSolar, toGrid);
    toGrid -= solarToGrid;
    fromSolar -= solarToGrid;

    const batteryToGrid: number = Math.min(fromBattery, toGrid);
    fromBattery -= batteryToGrid;

    const gridToBattery2: number = Math.min(fromGrid, toBattery);
    gridToBattery += gridToBattery2;
    fromGrid -= gridToBattery2;

    const solarToHome: number = Math.min(remaining, fromSolar);
    remaining -= solarToHome;

    const batteryToHome: number = Math.min(fromBattery, remaining);
    remaining -= batteryToHome;

    const gridToHome: number = Math.min(remaining, fromGrid);

    return {
      solarToHome: solarToHome,
      solarToBattery: solarToBattery,
      solarToGrid: solarToGrid,
      gridToHome: gridToHome,
      gridToBattery: gridToBattery,
      batteryToHome: batteryToHome,
      batteryToGrid: batteryToGrid
    };
  }

  //================================================================================================================================================================================//

  private _populateEntityArrays(): void {
    this._primaryEntityIds = [];
    this._secondaryEntityIds = [];

    [this.battery, this.gas, this.grid, this.home, this.lowCarbon, this.solar, ...this.devices].forEach(state => {
      this._primaryEntityIds.push(...state.importEntities);
      this._primaryEntityIds.push(...state.exportEntities);

      if (state.secondary.isPresent) {
        this._secondaryEntityIds.push(state.secondary.entity!);
      }
    });
  }

  //================================================================================================================================================================================//

  private _prepStatistics(entityIds: string[], currentStatistics: Statistics, previousStatistics: Statistics, periodStart: Date, periodEnd: Date): void {
    entityIds.forEach(entity => {
      const entityStats: StatisticValue[] = currentStatistics[entity];

      if (!entityStats || entityStats.length === 0 || entityStats[0].start > periodStart.getTime()) {
        let previousStat: StatisticValue;

        if (previousStatistics && previousStatistics[entity] && previousStatistics[entity].length !== 0) {
          // This entry is the final stat prior to the period we are interested in.  It is only needed for the case where we need to calculate
          // the Live-mode state-delta at midnight on the current date (ie, before the first stat of the new day has been generated) so we do
          // not want to include its values in the stats calculations.
          previousStat = previousStatistics[entity][0];
          previousStat.change = 0;
        } else {
          // no previous stat exists, so fake one up
          const stateObj: HassEntity = this.hass.states[entity];

          previousStat = {
            change: 0,
            state: Date.parse(stateObj.last_changed) <= periodEnd.getTime() ? Number(stateObj.state) : 0,
            sum: 0,
            start: -1,
            end: -1,
            min: 0,
            mean: 0,
            max: 0,
            last_reset: null,
            statistic_id: entity
          };
        }

        if (entityStats) {
          entityStats.unshift(previousStat);
        } else {
          currentStatistics[entity] = [previousStat];
        }
      }
    });
  }

  //================================================================================================================================================================================//

  private _fetchStatistics(periodStart: Date, periodEnd: Date, entityIds: string[], period: Period): Promise<Statistics> {
    return this.hass.callWS<Statistics>({
      type: "recorder/statistics_during_period",
      start_time: periodStart.toISOString(),
      end_time: periodEnd.toISOString(),
      statistic_ids: entityIds,
      period: period,
      types: ["state", "change", "sum"]
    });
  }

  //================================================================================================================================================================================//

  private _fetchCo2Data(periodStart: Date, periodEnd: Date, period: Period): Promise<Record<string, number>> {
    return this.hass.callWS<Record<string, number>>({
      type: "energy/fossil_energy_consumption",
      start_time: periodStart.toISOString(),
      end_time: periodEnd.toISOString(),
      energy_statistic_ids: this.grid.importEntities,
      co2_statistic_id: this.lowCarbon.firstImportEntity,
      period
    });
  }

  //================================================================================================================================================================================//

  private _getEntityStatistics(hass: HomeAssistant, statistics: Statistics, entityId: string, requestedUnits: string): Map<number, number> {
    const entityStats: Map<number, number> = new Map();
    const stateObj: HassEntity = hass.states[entityId];

    if (stateObj) {
      const statisticsForEntity: StatisticValue[] = statistics[entityId];

      if (statisticsForEntity && statisticsForEntity.length !== 0) {
        const units: string | undefined = stateObj.attributes.unit_of_measurement;

        statisticsForEntity.map(entry => {
          const state = this._toBaseUnits(entry.change ?? 0, units, requestedUnits);
          entityStats.set(entry.start, (entityStats.get(entry.start) ?? 0) + state);
        });
      }
    }

    return entityStats;
  }

  //================================================================================================================================================================================//

  private _toBaseUnits(value: number, units: string | undefined, requestedUnits: string | undefined = undefined): number {
    if (!units || !requestedUnits) {
      return value;
    }

    const baseUnits = this._getBaseUnits(units);
    const prefixes: string[] = Object.values(SIUnitPrefixes);
    let multiplier: number = 1;

    for (let n: number = 0; n < prefixes.length; n++, multiplier *= 1000) {
      if (units === prefixes[n] + baseUnits) {
        const fn: (value: number, gcf: number) => number = UNIT_CONVERSIONS[baseUnits]?.[requestedUnits] || ((value, _) => value);
        return fn(value, this._gasCalorificValue) * multiplier;
      }
    }

    return value;
  }

  //================================================================================================================================================================================//

  private _getBaseUnits(units: string): string {
    const prefixes: string[] = Object.values(SIUnitPrefixes);
    const supportedUnits: string[] = [
      EnergyUnits.Calories,
      EnergyUnits.Joules,
      EnergyUnits.WattHours
    ];

    for (let u: number = 0; u < supportedUnits.length; u++) {
      for (let p: number = 0; p < prefixes.length; p++) {
        if (units === prefixes[p] + supportedUnits[u]) {
          return supportedUnits[u];
        }
      }
    }

    return units;
  }

  //================================================================================================================================================================================//

  private _isPowerOutage(): boolean {
    return this.grid.powerOutage.isPresent ? this.hass.states[this.grid.powerOutage.entity_id].state === this.grid.powerOutage.state : false;
  }

  //================================================================================================================================================================================//

  private _calculateHomeTotals(states: States): void {
    const electricValues: number[] = [states.battery.import, states.grid.import, states.solarImport, states.battery.export, states.grid.export, states.lowCarbon];
    const gasValues: number[] = [states.gasImport];
    const gasVolumeValues: number[] = [states.gasImportVolume];

    states.homeElectric = states.battery.import + states.grid.import + states.solarImport - states.battery.export - states.grid.export;
    states.homeGas = states.gasImport;
    states.homeGasVolume = states.gasImportVolume;

    this.devices.forEach((device, index) => {
      if (device.type === EnergyType.Electric) {
        const deviceState: BiDiState = states.devicesElectric[index];
        states.homeElectric += deviceState.import - (device.subtractConsumption ? deviceState.export : 0);
        electricValues.push(deviceState.import, deviceState.export);
      } else {
        const deviceState: BiDiState = states.devicesGas[index];
        states.homeGas += deviceState.import - (device.subtractConsumption ? deviceState.export : 0);
        gasValues.push(deviceState.import, deviceState.export);

        const deviceVolumeState: BiDiState = states.devicesGasVolume[index];
        states.homeGasVolume += deviceVolumeState.import - (device.subtractConsumption ? deviceVolumeState.export : 0);
        gasVolumeValues.push(deviceVolumeState.import, deviceVolumeState.export);
      }
    });

    electricValues.push(states.homeElectric);
    gasValues.push(states.homeGas);
    gasVolumeValues.push(states.homeGasVolume);

    states.largestElectricValue = Math.max(...electricValues);
    states.largestGasValue = this._gasUnits === VolumeUnits.Same_As_Electric ? Math.max(...gasValues) : Math.max(...gasVolumeValues);
  }

  //================================================================================================================================================================================//

  private _rescaleFlows(states: States): void {
    // The net energy in the system is (imports-exports), but as the entities may not be updated in sync with each other it is possible that the flows to the home will
    // not add up to the same value.  When this happens, while we still want to return the net energy for display, we need to rescale the flows so that the animation and
    // circles will look sensible.
    const statesToHomeElectric: number = states.battery.import + states.grid.import + states.solarImport - states.battery.export - states.grid.export;
    const flowsToHomeElectric: number = states.flows.batteryToHome + states.flows.gridToHome + states.flows.solarToHome;

    if (flowsToHomeElectric > 0) {
      const scale: number = statesToHomeElectric / flowsToHomeElectric;

      if (scale > 0) {
        states.flows.batteryToHome *= scale;
        states.flows.gridToHome *= scale;
        states.flows.solarToHome *= scale;
      }
    }

    // and similar for the exports
    const toGrid: number = states.flows.batteryToGrid + states.flows.solarToGrid;

    if (toGrid > 0) {
      const scale: number = states.grid.export / toGrid;

      if (scale > 0) {
        states.flows.batteryToGrid *= scale;
        states.flows.solarToGrid *= scale;
      }
    }

    const toBattery: number = states.flows.gridToBattery + states.flows.solarToBattery;

    if (toBattery > 0) {
      const scale: number = states.battery.export / toBattery;

      if (scale > 0) {
        states.flows.gridToBattery *= scale;
        states.flows.solarToBattery *= scale;
      }
    }
  }

  //================================================================================================================================================================================//
}

//================================================================================================================================================================================//
