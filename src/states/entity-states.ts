import { HomeAssistant, round } from "custom-card-helpers";
import { HassEntity, UnsubscribeFunc } from "home-assistant-js-websocket";
import { EnergyCollection, EnergyData, EnergyPreferences, EnergySource, Statistics, StatisticValue } from "@/hass";
import { AppearanceOptions, EditorPages, EnergyFlowCardExtConfig, EnergyUnitsConfig, EnergyUnitsOptions, EntitiesOptions, FlowsOptions, GlobalOptions, SecondaryInfoOptions } from "@/config";
import { GridState } from "./grid";
import { BatteryState } from "./battery";
import { GasState } from "./gas";
import { HomeState } from "./home";
import { LowCarbonState } from "./low-carbon";
import { SolarState } from "./solar";
import { DeviceState } from "./device";
import { addDays, addHours, differenceInDays, endOfDay, endOfMonth, endOfQuarter, endOfToday, endOfWeek, endOfYear, endOfYesterday, getHours, isFirstDayOfMonth, isLastDayOfMonth, startOfDay, startOfMonth, startOfQuarter, startOfToday, startOfWeek, startOfYear, startOfYesterday, subDays, subMonths } from "date-fns";
import { EnergyUnits, EnergyUnitPrefix, EntityMode, VolumeUnits, checkEnumValue, DateRange } from "@/enums";
import { logDebug } from "@/logging";
import { getEnergyDataCollection } from "@/energy";
import { ValueState } from "./state";
import { Flows, States } from ".";
import { UNIT_CONVERSIONS } from "./unit-conversions";
import { DEFAULT_CONFIG, DEFAULT_GAS_CONFIG, getConfigObjects, getConfigValue } from "@/config/config";

const ENERGY_DATA_TIMEOUT: number = 10000;
const ENERGY_DATA_POLL: number = 100;

const Period = {
  Hour: "hour",
  Day: "day",
  Month: "month"
} as const;

type Period = typeof Period[keyof typeof Period];

export class EntityStates {
  public hass: HomeAssistant;

  public get isDatePickerPresent(): boolean {
    return this._isDatePickerPresent;
  }

  public get isDataPresent(): boolean {
    return !!this._primaryStatistics;
  }

  public get isConfigPresent(): boolean {
    return this._isLoaded;
  }

  public get periodStart(): Date | undefined {
    return this._periodStart;
  }

  public get periodEnd(): Date | undefined {
    return this._periodEnd;
  }

  public battery!: BatteryState;
  public gas!: GasState;
  public grid!: GridState;
  public home!: HomeState;
  public lowCarbon!: LowCarbonState;
  public solar!: SolarState;
  public devices!: DeviceState[];

  private _isLoaded: boolean = false;
  private _isDatePickerPresent: boolean = false;
  private _periodStart: Date | undefined = undefined;
  private _periodEnd: Date | undefined = undefined;
  private _dateRange: DateRange;
  private _dateRangeLive: boolean;
  private _primaryEntityIds: string[] = [];
  private _secondaryEntityIds: string[] = [];
  private _primaryStatistics?: Statistics;
  private _secondaryStatistics?: Statistics;
  private _entityModes: Map<string, EntityMode> = new Map();
  private _co2data?: Record<string, number>;
  private _energyUnits: string;
  private _volumeUnits: string;
  private _gasCalorificValue: number;
  private _useHourlyStats: boolean;

  //================================================================================================================================================================================//

  public constructor(hass: HomeAssistant, config: EnergyFlowCardExtConfig) {
    const configs: EnergyFlowCardExtConfig[] = [config, DEFAULT_CONFIG];

    this.hass = hass;
    this._dateRange = getConfigValue(configs, GlobalOptions.Date_Range);
    this._dateRangeLive = getConfigValue(configs, GlobalOptions.Date_Range_Live);

    const energyUnitsConfig: EnergyUnitsConfig[] = getConfigObjects(configs, [EditorPages.Appearance, AppearanceOptions.Energy_Units]);
    this._energyUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Electric_Units, value => checkEnumValue(value, EnergyUnits));
    this._volumeUnits = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Units, value => checkEnumValue(value, VolumeUnits));

    if (this._volumeUnits === VolumeUnits.Same_As_Electric) {
      this._volumeUnits = VolumeUnits.Cubic_Metres;
    }

    this._gasCalorificValue = getConfigValue(energyUnitsConfig, EnergyUnitsOptions.Gas_Calorific_Value);
    this._useHourlyStats = getConfigValue(configs, [EditorPages.Appearance, AppearanceOptions.Flows, FlowsOptions.Use_Hourly_Stats]);
  }

  //================================================================================================================================================================================//

  public getStates(): States | undefined {
    if (!this.isDataPresent) {
      return undefined;
    }

    const states: States = {
      largestElectricValue: 0,
      largestGasValue: 0,
      batteryImport: this.battery.state.import,
      batteryExport: this.battery.state.export,
      batterySecondary: this.battery.secondary.state,
      gasImport: this.gas.state.import,
      gasImportVolume: this.gas.state.importVolume,
      gasSecondary: this.gas.secondary.state,
      gridImport: this.grid.state.import,
      gridExport: this.grid.state.export,
      gridSecondary: this.grid.secondary.state,
      highCarbon: this.grid.state.highCarbon,
      homeElectric: 0,
      homeGas: 0,
      homeGasVolume: 0,
      homeSecondary: this.home.secondary.state,
      lowCarbon: 0,
      lowCarbonPercentage: 0,
      lowCarbonSecondary: this.lowCarbon.secondary.state,
      solarImport: this.solar.state.import,
      solarSecondary: this.solar.secondary.state,
      // TODO: devices
      devices: [],
      devicesSecondary: this.devices.map(device => device.secondary.state),
      flows: {
        batteryToGrid: this.grid.state.fromBattery,
        solarToGrid: this.grid.state.fromSolar,
        gridToBattery: this.battery.state.fromGrid,
        solarToBattery: this.battery.state.fromSolar,
        batteryToHome: this.home.state.fromBattery,
        gridToHome: this.home.state.fromGrid,
        solarToHome: this.home.state.fromSolar
      }
    };

    this._addStateDeltas(states);

    // TODO: electric-producing devices need adding here
    states.homeElectric = states.batteryImport + states.gridImport + states.solarImport - states.batteryExport - states.gridExport;
    states.lowCarbon = states.gridImport - states.highCarbon;
    states.lowCarbonPercentage = (states.lowCarbon / states.gridImport) * 100 ?? 0;

    // TODO: gas-producing devices need adding to here
    states.homeGas = states.gasImport;
    states.homeGasVolume = states.gasImportVolume;

    // The net energy in the system is (imports-exports), but as the entities may not be updated in sync with each other it is possible that the flows to the home will
    // not add up to the same value.  When this happens, while we still want to return the net energy for display, we need to rescale the flows so that the animation and
    // circles will look sensible.
    const toHome: number = states.flows.batteryToHome + states.flows.gridToHome + states.flows.solarToHome;

    if (toHome > 0) {
      const scale: number = states.homeElectric / toHome;

      if (scale > 0) {
        states.flows.batteryToHome *= scale;
        states.flows.gridToHome *= scale;
        states.flows.solarToHome *= scale;
      }
    }

    // and similar for the exports
    const toGrid: number = states.flows.batteryToGrid + states.flows.solarToGrid;

    if (toGrid > 0) {
      const scale = states.gridExport / toGrid;

      if (scale > 0) {
        states.flows.batteryToGrid *= scale;
        states.flows.solarToGrid *= scale;
      }
    }

    const toBattery: number = states.flows.gridToBattery + states.flows.solarToBattery;

    if (toBattery > 0) {
      const scale = states.batteryExport / toBattery;

      if (scale > 0) {
        states.flows.gridToBattery *= scale;
        states.flows.solarToBattery *= scale;
      }
    }

    states.largestElectricValue = Math.max(
      states.batteryImport,
      states.batteryExport,
      states.gridImport,
      states.gridExport,
      states.homeElectric,
      states.lowCarbon,
      states.solarImport
    );

    // TODO: add gas-producing devices
    states.largestGasValue = this._volumeUnits === VolumeUnits.Same_As_Electric ? states.gasImport : states.gasImportVolume;

    return states;
  }

  //================================================================================================================================================================================//

  public async subscribe(config: EnergyFlowCardExtConfig): Promise<UnsubscribeFunc> {
    await this._loadConfig(this.hass, config);

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
        .then(async (collection: EnergyCollection) => collection.subscribe(async (data: EnergyData) => this._loadStatistics(data.start, data.end || endOfToday())))
        .catch(err => {
          logDebug(err);
          return (): void => { };
        });
    }

    let refresh: NodeJS.Timeout;

    const loadStatistics = () => {
      // TODO: other date-ranges
      const nextFetch: Date = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (this._dateRange === DateRange.Custom) {
        periodStart = getConfigValue(config, GlobalOptions.Date_Range_From) || startOfToday();
        periodEnd = getConfigValue(config, GlobalOptions.Date_Range_To) || endOfToday();
      } else {
        [periodStart, periodEnd] = this._calculateDateRange(this._dateRange);
      }

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

  private async _loadConfig(hass: HomeAssistant, config: EnergyFlowCardExtConfig): Promise<void> {
    const configs: EnergyFlowCardExtConfig[] = [config, DEFAULT_CONFIG];
    let energySources: EnergySource[] = [];

    if (getConfigValue(configs, GlobalOptions.Use_HASS_Config)) {
      const prefs: EnergyPreferences = await this._getEnergyPreferences(hass);
      energySources = prefs?.energy_sources;
    }

    this.battery = new BatteryState(hass, getConfigValue(configs, EditorPages.Battery), energySources);
    this.gas = new GasState(hass, getConfigValue(configs, EditorPages.Gas), energySources);
    this.grid = new GridState(hass, getConfigValue(configs, EditorPages.Grid), energySources);
    this.home = new HomeState(hass, getConfigValue(configs, EditorPages.Home));
    this.lowCarbon = new LowCarbonState(hass, getConfigValue(configs, EditorPages.Low_Carbon));
    this.solar = new SolarState(hass, getConfigValue(configs, EditorPages.Solar), energySources);
    this.devices = (getConfigValue(configs, EditorPages.Devices) || []).flatMap(device => new DeviceState(hass, device));
    this._populateEntityArrays();
    this._inferEntityModes();
    this._isLoaded = true;
  }

  //================================================================================================================================================================================//

  private _addStateDeltas(states: States): void {
    if (!this._dateRangeLive) {
      return;
    }

    const periodStart: Date = this._periodStart!;
    const periodEnd: Date = this._periodEnd!;

    const solarImportDelta: number = this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.solar.importEntities, this._energyUnits);
    const batteryImportDelta: number = this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.battery.importEntities, this._energyUnits);
    const batteryExportDelta: number = this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.battery.exportEntities, this._energyUnits);
    const gridImportDelta: number = this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.grid.importEntities, this._energyUnits);
    const gridExportDelta: number = this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.grid.exportEntities, this._energyUnits);
    const flowDeltas: Flows = this._calculateFlows(solarImportDelta, batteryImportDelta, batteryExportDelta, gridImportDelta, gridExportDelta);

    states.batteryImport += batteryImportDelta;
    states.batteryExport += batteryExportDelta;
    states.gridImport += gridImportDelta;
    states.gridExport += gridExportDelta;
    states.solarImport += solarImportDelta;
    // TODO: devices

    states.flows.batteryToGrid += flowDeltas.batteryToGrid;
    states.flows.solarToGrid += flowDeltas.solarToGrid;
    states.flows.gridToBattery += flowDeltas.gridToBattery;
    states.flows.solarToBattery += flowDeltas.solarToBattery;
    states.flows.batteryToHome += flowDeltas.batteryToHome;
    states.flows.gridToHome += flowDeltas.gridToHome;
    states.flows.solarToHome += flowDeltas.solarToHome;

    states.gasImport += this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.gas.importEntities, this._energyUnits);
    states.gasImportVolume += this._getStateDelta(periodStart, periodEnd, this._primaryStatistics, this.gas.importEntities, this._volumeUnits);

    const highCarbonDelta: number = this.lowCarbon.isPresent ? gridImportDelta * Number(this.hass.states[this.lowCarbon.firstImportEntity!].state) / 100 : 0;
    states.highCarbon += highCarbonDelta;

    states.batterySecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.battery.secondary.importEntities, getConfigValue(this.battery.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    states.gasSecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.gas.secondary.importEntities, getConfigValue(this.gas.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    states.gridSecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.grid.secondary.importEntities, getConfigValue(this.grid.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    states.homeSecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.home.secondary.importEntities, getConfigValue(this.home.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    states.lowCarbonSecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.lowCarbon.secondary.importEntities, getConfigValue(this.lowCarbon.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    states.solarSecondary += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, this.solar.secondary.importEntities, getConfigValue(this.solar.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
    this.devices.forEach((device, index) => states.devicesSecondary[index] += this._getStateDelta(periodStart, periodEnd, this._secondaryStatistics, device.secondary.importEntities, this._energyUnits));
  }

  //================================================================================================================================================================================//

  private _getStateDelta(periodStart: Date, periodEnd: Date, statistics: Statistics | undefined, entityIds: string[] | undefined = [], requestedUnits: string): number {
    if (!statistics || entityIds.length === 0) {
      return 0;
    }

    let deltaSum: number = 0;

    entityIds.forEach(entityId => {
      const stateObj: HassEntity = this.hass.states[entityId];

      if (stateObj) {
        const lastChanged: number = Date.parse(stateObj.last_changed);

        if (lastChanged >= periodStart.getTime() && lastChanged <= periodEnd.getTime()) {
          const entityStats: StatisticValue[] = statistics[entityId];
          const state: number = Number(stateObj.state);

          if (entityStats && entityStats.length !== 0) {
            const units = stateObj.attributes.unit_of_measurement;
            deltaSum += this._toBaseUnits(state - (entityStats[entityStats.length - 1].state ?? 0), units, requestedUnits);
          }
        }
      }
    });

    return deltaSum;
  }

  //================================================================================================================================================================================//

  private async _loadStatistics(periodStart: Date, periodEnd: Date): Promise<void> {
    this._primaryStatistics = undefined;
    this._secondaryStatistics = undefined;

    this._periodStart = periodStart;
    this._periodEnd = periodEnd;

    const dayDiff: number = differenceInDays(periodEnd, periodStart);
    const period: Period = this._useHourlyStats ? Period.Hour : isFirstDayOfMonth(periodStart) && isLastDayOfMonth(periodEnd) && dayDiff > 35 ? Period.Month : dayDiff > 2 ? Period.Day : Period.Hour;

    const timeout: NodeJS.Timeout = setTimeout(() => logDebug(`No energy statistics received after ${ENERGY_DATA_TIMEOUT * 2}ms`), ENERGY_DATA_TIMEOUT * 2);
    const fetchStartTime: number = Date.now();

    const [previousPrimaryData, primaryData, co2data, previousSecondaryData, secondaryData] = await Promise.all([
      this._fetchStatistics(addHours(periodStart, -1), periodStart, this._primaryEntityIds, Period.Hour),
      this._fetchStatistics(periodStart, periodEnd, this._primaryEntityIds, period),
      this.lowCarbon.isPresent ? this._fetchCo2Data(periodStart, periodEnd, period) : Promise.resolve(),
      this._secondaryEntityIds.length !== 0 ? this._fetchStatistics(addHours(periodStart, -1), periodStart, this._secondaryEntityIds, Period.Hour) : Promise.resolve(),
      this._secondaryEntityIds.length !== 0 ? this._fetchStatistics(periodStart, periodEnd, this._secondaryEntityIds, Period.Day) : Promise.resolve()
    ]);

    logDebug(`Received per-${period} stats (primary${this.lowCarbon.isPresent ? ", low-carbon" : ""}${this._secondaryEntityIds.length !== 0 ? ", secondary" : ""}) for period ${periodStart} - ${periodEnd}] at ${new Date()} in ${Date.now() - fetchStartTime}ms`);
    clearTimeout(timeout);

    if (co2data) {
      this._co2data = co2data as Record<string, number>;
    }

    if (primaryData) {
      this._validateStatistics(this._primaryEntityIds, primaryData, previousPrimaryData, periodStart, periodEnd);
      this._primaryStatistics = primaryData;
      this._calculatePrimaryStatistics();
    }

    if (secondaryData) {
      this._validateStatistics(this._secondaryEntityIds, secondaryData as Statistics, previousSecondaryData as Statistics, periodStart, periodEnd);
      this._secondaryStatistics = secondaryData as Statistics;
      this._calculateSecondaryStatistics();
    }
  }

  //================================================================================================================================================================================//

  private async _inferEntityModes(): Promise<void> {
    const statistics: Statistics = await this._fetchStatistics(addDays(startOfToday(), -1), startOfToday(), [...this._primaryEntityIds, ...this._secondaryEntityIds], Period.Day);

    for (const entity in statistics) {
      if (statistics[entity].length !== 0) {
        const firstStat: StatisticValue = statistics[entity][0];
        let mode;

        if (this._isMisconfiguredResettingSensor(firstStat)) {
          mode = EntityMode.Misconfigured_Resetting;
        } else if (this._isTotalisingSensor(firstStat)) {
          mode = EntityMode.Totalising;
        } else {
          mode = EntityMode.Resetting;
        }

        logDebug(`${entity} is a ${mode} sensor (change=${firstStat.change}, state=${firstStat.state})`);
        this._entityModes.set(entity, mode);
      } else {
        this._entityModes.set(entity, EntityMode.Totalising);
      }
    }
  }

  //================================================================================================================================================================================//

  private _isMisconfiguredResettingSensor(stat: StatisticValue): boolean {
    const change: number = round(stat.change ?? 0, 6);
    const state: number = round(stat.state ?? 0, 6);
    return change > state || change < 0;
  }

  //================================================================================================================================================================================//

  private _isTotalisingSensor(stat: StatisticValue): boolean {
    const change: number = round(stat.change ?? 0, 6);
    const state: number = round(stat.state ?? 0, 6);
    return change >= 0 && change < state;
  }

  //================================================================================================================================================================================//

  private _calculatePrimaryStatistics(): void {
    if (!this._primaryStatistics) {
      return;
    }

    const combinedStats: Map<number, Map<string, number>> = new Map();

    if (this.grid.isPresent && !this._isPowerOutage()) {
      this._addFlowStats(this._primaryStatistics, combinedStats, this.grid.importEntities, this._energyUnits);
      this._addFlowStats(this._primaryStatistics, combinedStats, this.grid.exportEntities, this._energyUnits);
    }

    if (this.battery.isPresent) {
      this._addFlowStats(this._primaryStatistics, combinedStats, this.battery.importEntities, this._energyUnits);
      this._addFlowStats(this._primaryStatistics, combinedStats, this.battery.exportEntities, this._energyUnits);
    }

    if (this.solar.isPresent) {
      this._addFlowStats(this._primaryStatistics, combinedStats, this.solar.importEntities, this._energyUnits);
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
      const sp: number = this._getFlowEntityStates(entry, this.solar.importEntities);
      const bi: number = this._getFlowEntityStates(entry, this.battery.importEntities);
      const be: number = this._getFlowEntityStates(entry, this.battery.exportEntities);
      const gi: number = this._getFlowEntityStates(entry, this.grid.importEntities);
      const ge: number = this._getFlowEntityStates(entry, this.grid.exportEntities);
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

    if (this.grid.isPresent) {
      if (this._isPowerOutage()) {
        this.grid.powerOutage.isOutage = true;
        this.grid.state.import = 0;
        this.grid.state.export = 0;
        this.grid.state.fromBattery = 0;
        this.grid.state.fromSolar = 0;
        this.grid.state.highCarbon = 0;
        this.home.state.fromGrid = 0;
      } else {
        this.grid.powerOutage.isOutage = false;
        this.grid.state.import = gridImport;
        this.grid.state.export = gridExport;

        if (this.battery.isPresent) {
          this.grid.state.fromBattery = batteryToGrid;
        }

        if (this.solar.isPresent) {
          this.grid.state.fromSolar = solarToGrid;
        }

        if (this.lowCarbon.isPresent && this._co2data) {
          this.grid.state.highCarbon = this._toBaseUnits(Object.values(this._co2data).reduce((sum, a) => sum + a, 0), EnergyUnitPrefix.Kilo + EnergyUnits.WattHours, this._energyUnits);
        } else {
          this.grid.state.highCarbon = this.grid.state.import;
        }

        this.home.state.fromGrid = gridToHome;
      }
    } else {
      this.home.state.fromGrid = 0;
    }

    if (this.battery.isPresent) {
      this.battery.state.import = batteryImport;
      this.battery.state.export = batteryExport;

      if (this.grid.isPresent) {
        this.battery.state.fromGrid = gridToBattery;
      }

      if (this.solar.isPresent) {
        this.battery.state.fromSolar = solarToBattery;
      }

      this.home.state.fromBattery = batteryToHome;
    } else {
      this.home.state.fromBattery = 0;
    }

    if (this.solar.isPresent) {
      this.solar.state.import = solarProduction;
      this.home.state.fromSolar = solarToHome;
    } else {
      this.home.state.fromSolar = 0;
    }

    if (this.gas.isPresent) {
      this.gas.state.import = this._getDirectEntityStates([this.gas.config, DEFAULT_GAS_CONFIG], this.gas.importEntities, this._energyUnits);
      this.gas.state.importVolume = this._getDirectEntityStates([this.gas.config, DEFAULT_GAS_CONFIG], this.gas.importEntities, this._volumeUnits);
    } else {
      this.gas.state.import = 0;
      this.gas.state.importVolume = 0;
    }
  }

  //================================================================================================================================================================================//

  private _calculateSecondaryStatistics(): void {
    if (!this._secondaryStatistics) {
      return;
    }

    this._setSecondaryStatistic(this.battery);
    this._setSecondaryStatistic(this.gas);
    this._setSecondaryStatistic(this.grid);
    this._setSecondaryStatistic(this.home);
    this._setSecondaryStatistic(this.lowCarbon);
    this._setSecondaryStatistic(this.solar);
    this.devices.forEach(device => this._setSecondaryStatistic(device));
  }

  //================================================================================================================================================================================//

  private _setSecondaryStatistic(state: ValueState): void {
    if (!state.secondary.isPresent) {
      return;
    }

    state.secondary.state = this._getEntityStates(this._secondaryStatistics!, state.secondary.firstImportEntity!, getConfigValue(state.secondary.config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]));
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

  private _getFlowEntityStates(entry: Map<string, number>, entityIds: string[] | undefined = []): number {
    if (entityIds.length === 0) {
      return 0;
    }

    let stateSum: number = 0;

    entityIds.forEach(entityId =>
      stateSum += entry.get(entityId) ?? 0
    );

    return stateSum;
  }

  //================================================================================================================================================================================//

  private _getDirectEntityStates(config: any[], entityIds: string[] | undefined = [], requestedUnits: string): number {
    const configUnits: string | undefined = getConfigValue(config, [EntitiesOptions.Entities, SecondaryInfoOptions.Units]);
    let stateSum: number = 0;

    entityIds.forEach(entityId => {
      stateSum += this._getEntityStates(this._primaryStatistics!, entityId, configUnits || this.hass.states[entityId].attributes.unit_of_measurement, requestedUnits);
    });

    return stateSum;
  }

  //================================================================================================================================================================================//

  private _getEntityStates(statistics: Statistics, entityId: string, units: string | undefined, requestedUnits: string | undefined = undefined): number {
    const entityStats: StatisticValue[] = statistics[entityId];

    if (entityStats.length !== 0) {
      const state: number = entityStats.map(stat => stat.change || 0).reduce((result, change) => result + change, 0) ?? 0;
      return this._toBaseUnits(state, units || this.hass.states[entityId].attributes.unit_of_measurement, requestedUnits);
    }

    return 0;
  }

  //================================================================================================================================================================================//

  private _calculateFlows(fromSolar: number, fromBattery: number, toBattery: number, fromGrid: number, toGrid: number): Flows {
    const energyIn: number = fromGrid + fromSolar + fromBattery;
    const energyOut: number = toGrid + toBattery;
    let remaining: number = Math.max(0, energyIn - energyOut);
    let solarToHome: number;
    let gridToHome: number;
    let gridToBattery: number;
    let batteryToGrid: number;
    let batteryToHome: number;
    let solarToBattery: number;
    let solarToGrid: number;

    if (this._isPowerOutage()) {
      fromGrid = 0;
      toGrid = 0;
    }

    const excess: number = Math.max(0, Math.min(toBattery, fromGrid - remaining));
    gridToBattery = excess;
    toBattery -= excess;
    fromGrid -= excess;

    solarToBattery = Math.min(fromSolar, toBattery);
    toBattery -= solarToBattery;
    fromSolar -= solarToBattery;

    solarToGrid = Math.min(fromSolar, toGrid);
    toGrid -= solarToGrid;
    fromSolar -= solarToGrid;

    batteryToGrid = Math.min(fromBattery, toGrid);
    fromBattery -= batteryToGrid;

    const gridToBattery2: number = Math.min(fromGrid, toBattery);
    gridToBattery += gridToBattery2;
    fromGrid -= gridToBattery2;

    solarToHome = Math.min(remaining, fromSolar);
    remaining -= solarToHome;

    batteryToHome = Math.min(fromBattery, remaining);
    remaining -= batteryToHome;

    gridToHome = Math.min(remaining, fromGrid);

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

      if (state["exportEntities"]) {
        this._primaryEntityIds.push(...state["exportEntities"]);
      }

      this._secondaryEntityIds.push(...state.secondary.importEntities);
    });
  }

  //================================================================================================================================================================================//

  private _validateStatistics(entityIds: string[], currentStatistics: Statistics, previousStatistics: Statistics, periodStart: Date, periodEnd: Date): void {
    entityIds.forEach(entity => {
      let entityStats: StatisticValue[] = currentStatistics[entity];
      let idx: number = 0;

      if (!entityStats || entityStats.length === 0 || entityStats[0].start > periodStart.getTime()) {
        let dummyStat: StatisticValue;

        if (previousStatistics && previousStatistics[entity] && previousStatistics[entity]?.length !== 0) {
          // This entry is the final stat prior to the period we are interested in.  It is only needed for the case where we need to calculate the
          // Live/Hybrid-mode state-delta at midnight on the current date (ie, before the first stat of the new day has been generated) so we do
          // not want to include its values in the stats calculations.
          const previousStat: StatisticValue = previousStatistics[entity][0];

          dummyStat = {
            ...previousStat,
            change: 0,
            state: this._entityModes.get(entity) === EntityMode.Totalising ? previousStat.state : 0
          };
        } else {
          dummyStat = {
            change: 0,
            state: 0,
            sum: 0,
            start: periodStart.getTime(),
            end: periodEnd.getTime(),
            min: 0,
            mean: 0,
            max: 0,
            last_reset: null,
            statistic_id: entity
          };
        }

        if (entityStats) {
          entityStats.unshift(dummyStat);
        } else {
          entityStats = new Array(dummyStat);
          currentStatistics[entity] = entityStats;
        }

        idx++;
      }

      if (entityStats.length > idx) {
        let lastState: number = 0;

        entityStats.forEach(stat => {
          if (getHours(stat.start) === 0) {
            if (this._entityModes.get(entity) === EntityMode.Misconfigured_Resetting) {
              // this is a 'resetting' sensor which has been misconfigured such that the first 'change' value following the reset is out of range
              stat.change = stat.state;
            }

            lastState = stat.state ?? 0;
          } else {
            // the 'change' values coming back from statistics are not always correct, so recalculate them from the state-diffs
            const state: number = stat.state ?? 0;
            const change: number = state - lastState;

            if (this._entityModes.get(entity) === EntityMode.Totalising) {
              stat.change = change;
            } else {
              stat.change = Math.max(0, change);
            }

            lastState = state;
          }
        });
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
      types: ["sum", "state", "change"]
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

  private _getEnergyPreferences = (hass: HomeAssistant) =>
    hass.callWS<EnergyPreferences>({
      type: "energy/get_prefs",
    });

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
    const prefixes: string[] = Object.values(EnergyUnitPrefix);
    let multiplier: number = 1;

    for (let n: number = 0; n < prefixes.length; n++, multiplier *= 1000) {
      if (units === prefixes[n] + baseUnits) {
        const fn: (value: number, gcf: number) => number = UNIT_CONVERSIONS[baseUnits][requestedUnits];
        return fn(value, this._gasCalorificValue) * multiplier;
      }
    }

    return value;
  }

  //================================================================================================================================================================================//

  private _getBaseUnits(units: string): string {
    const prefixes: string[] = Object.values(EnergyUnitPrefix);
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

  private _isPowerOutage = (): boolean => this.grid.powerOutage.isPresent ? this.hass.states[this.grid.powerOutage.entity_id].state === this.grid.powerOutage.state : false;

  //================================================================================================================================================================================//

  private _calculateDateRange = (range: DateRange): [Date, Date] => {
    const now: Date = new Date();

    switch (range) {
      case DateRange.Yesterday:
        return [startOfYesterday(), endOfYesterday()];

      case DateRange.This_Week:
        return [startOfWeek(now), endOfWeek(now)];

      case DateRange.This_Month:
        return [startOfMonth(now), endOfMonth(now)];

      case DateRange.This_Quarter:
        return [startOfQuarter(now), endOfQuarter(now)];

      case DateRange.This_Year:
        return [startOfYear(now), endOfYear(now)];

      case DateRange.Last_7_Days:
        return [startOfDay(subDays(now, 7)), endOfDay(now)];

      case DateRange.Last_30_Days:
        return [startOfDay(subDays(now, 30)), endOfDay(now)];

      case DateRange.Last_12_Months:
        return [startOfDay(startOfMonth(subMonths(now, 12))), endOfMonth(subMonths(now, 1))];
    }

    return [startOfToday(), endOfToday()];
  }

  //================================================================================================================================================================================//
}
