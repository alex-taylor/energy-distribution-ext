import { EnergyUnits, VolumeUnits } from "@/enums";

const CALORIES_TO_JOULES: number = 4.184;
const JOULES_TO_CALORIES: number = 1 / CALORIES_TO_JOULES;
const WATTHOURS_TO_CALORIES: number = 860.42065;
const CALORIES_TO_WATTHOURS: number = 1 / WATTHOURS_TO_CALORIES;
const WATTHOURS_TO_JOULES: number = 3600;
const JOULES_TO_WATTHOURS: number = 1 / WATTHOURS_TO_JOULES;
const CUBIC_METRES_TO_CUBIC_FEET: number = 35.31467;
const CUBIC_FEET_TO_CUBIC_METRES: number = 1 / CUBIC_METRES_TO_CUBIC_FEET;
const CUBIC_METRES_TO_LITRES: number = 1000;
const LITRES_TO_CUBIC_METRES: number = 1 / CUBIC_METRES_TO_LITRES;

const VOLUME_CORRECTION: number = 1.02264;

interface ConversionFunctions {
  [EnergyUnits.Calories]: (value: number, gcv: number) => number;
  [EnergyUnits.Joules]: (value: number, gcv: number) => number;
  [EnergyUnits.WattHours]: (value: number, gcv: number) => number;
  [VolumeUnits.CCF]: (value: number, gcv: number) => number;
  [VolumeUnits.Cubic_Feet]: (value: number, gcv: number) => number;
  [VolumeUnits.Cubic_Metres]: (value: number, gcv: number) => number;
  [VolumeUnits.Litres]: (value: number, gcv: number) => number;
  [VolumeUnits.MCF]: (value: number, gcv: number) => number;
}

const caloriesToJoules = (calories: number): number => calories * CALORIES_TO_JOULES;
const caloriesToWattHours = (calories: number): number => calories * CALORIES_TO_WATTHOURS;

const joulesToCalories = (joules: number): number => joules * JOULES_TO_CALORIES;
const joulesToWattHours = (joules: number): number => joules * JOULES_TO_WATTHOURS;

const wattHoursToCalories = (wattHours: number): number => wattHours * WATTHOURS_TO_CALORIES;
const wattHoursToJoules = (wattHours: number): number => wattHours * WATTHOURS_TO_JOULES;

const ccfToCubicFeet = (ccf: number): number => ccf * 100;
const cubicFeetToCcf = (cubicFeet: number): number => cubicFeet / 100;

const mcfToCubicFeet = (mcf: number): number => mcf * 1000;
const cubicFeetToMcf = (cubicFeet: number): number => cubicFeet / 1000;

const cubicFeetToCubicMetres = (cubicFeet: number): number => cubicFeet * CUBIC_FEET_TO_CUBIC_METRES;
const cubicMetresToCubicFeet = (cubicMetres: number): number => cubicMetres * CUBIC_METRES_TO_CUBIC_FEET;

const cubicMetresToLitres = (cubicMetres: number): number => cubicMetres * CUBIC_METRES_TO_LITRES;
const litresToCubicMetres = (litres: number): number => litres * LITRES_TO_CUBIC_METRES;
const litresToCubicFeet = (litres: number): number => cubicMetresToCubicFeet(litresToCubicMetres(litres));

const cubicMetresToWattHours = (volume: number, calorificValue: number): number => volume * VOLUME_CORRECTION * calorificValue * 1000000 * JOULES_TO_WATTHOURS;
const wattHoursToCubicMetres = (energy: number, calorificValue: number): number => energy * WATTHOURS_TO_JOULES / 1000000 / calorificValue / VOLUME_CORRECTION;

const caloriesToCubicMetres = (calories: number, calorificValue: number): number => wattHoursToCubicMetres(caloriesToWattHours(calories), calorificValue);
const joulesToCubicMetres = (joules: number, calorificValue: number): number => wattHoursToCubicMetres(joulesToWattHours(joules), calorificValue);

const ccfToWattHours = (ccf: number, calorificValue: number): number => cubicMetresToWattHours(ccfToCubicMetres(ccf), calorificValue);
const cubicFeetToWattHours = (cubicFeet: number, calorificValue: number): number => cubicMetresToWattHours(cubicFeetToCubicMetres(cubicFeet), calorificValue);
const litresToWattHours = (litres: number, calorificValue: number): number => cubicMetresToWattHours(litresToCubicMetres(litres), calorificValue);
const mcfToWattHours = (mcf: number, calorificValue: number): number => cubicMetresToWattHours(mcfToCubicMetres(mcf), calorificValue);

const ccfToCubicMetres = (ccf: number): number => cubicFeetToCubicMetres(ccfToCubicFeet(ccf));
const mcfToCubicMetres = (mcf: number): number => cubicFeetToCubicMetres(mcfToCubicFeet(mcf));

export const UNIT_CONVERSIONS: {
  [EnergyUnits.Calories]: ConversionFunctions;
  [EnergyUnits.Joules]: ConversionFunctions;
  [EnergyUnits.WattHours]: ConversionFunctions;
  [VolumeUnits.CCF]: ConversionFunctions;
  [VolumeUnits.Cubic_Feet]: ConversionFunctions;
  [VolumeUnits.Cubic_Metres]: ConversionFunctions;
  [VolumeUnits.Litres]: ConversionFunctions;
  [VolumeUnits.MCF]: ConversionFunctions;
} = {
  [EnergyUnits.Calories]: {
    [EnergyUnits.Calories]: value => value,
    [EnergyUnits.Joules]: value => caloriesToJoules(value),
    [EnergyUnits.WattHours]: value => caloriesToWattHours(value),
    [VolumeUnits.CCF]: (value, gcf) => cubicFeetToCcf(cubicMetresToCubicFeet(caloriesToCubicMetres(value, gcf))),
    [VolumeUnits.Cubic_Feet]: (value, gcf) => cubicMetresToCubicFeet(caloriesToCubicMetres(value, gcf)),
    [VolumeUnits.Cubic_Metres]: (value, gcf) => caloriesToCubicMetres(value, gcf),
    [VolumeUnits.Litres]: (value, gcf) => cubicMetresToLitres(caloriesToCubicMetres(value, gcf)),
    [VolumeUnits.MCF]: (value, gcf) => cubicFeetToMcf(cubicMetresToCubicFeet(caloriesToCubicMetres(value, gcf)))
  },
  [EnergyUnits.Joules]: {
    [EnergyUnits.Calories]: value => joulesToCalories(value),
    [EnergyUnits.Joules]: value => value,
    [EnergyUnits.WattHours]: value => joulesToWattHours(value),
    [VolumeUnits.CCF]: (value, gcf) => cubicFeetToCcf(cubicMetresToCubicFeet(joulesToCubicMetres(value, gcf))),
    [VolumeUnits.Cubic_Feet]: (value, gcf) => cubicMetresToCubicFeet(joulesToCubicMetres(value, gcf)),
    [VolumeUnits.Cubic_Metres]: (value, gcf) => joulesToCubicMetres(value, gcf),
    [VolumeUnits.Litres]: (value, gcf) => cubicMetresToLitres(joulesToCubicMetres(value, gcf)),
    [VolumeUnits.MCF]: (value, gcf) => cubicFeetToMcf(cubicMetresToCubicFeet(joulesToCubicMetres(value, gcf)))
  },
  [EnergyUnits.WattHours]: {
    [EnergyUnits.Calories]: value => wattHoursToCalories(value),
    [EnergyUnits.Joules]: value => wattHoursToJoules(value),
    [EnergyUnits.WattHours]: value => value,
    [VolumeUnits.CCF]: (value, gcf) => cubicFeetToCcf(cubicMetresToCubicFeet(wattHoursToCubicMetres(value, gcf))),
    [VolumeUnits.Cubic_Feet]: (value, gcf) => cubicMetresToCubicFeet(wattHoursToCubicMetres(value, gcf)),
    [VolumeUnits.Cubic_Metres]: (value, gcf) => wattHoursToCubicMetres(value, gcf),
    [VolumeUnits.Litres]: (value, gcf) => cubicMetresToLitres(wattHoursToCubicMetres(value, gcf)),
    [VolumeUnits.MCF]: (value, gcf) => cubicFeetToMcf(cubicMetresToCubicFeet(wattHoursToCubicMetres(value, gcf)))
  },
  [VolumeUnits.CCF]: {
    [EnergyUnits.Calories]: (value, gcf) => wattHoursToCalories(ccfToWattHours(value, gcf)),
    [EnergyUnits.Joules]: (value, gcf) => wattHoursToJoules(ccfToWattHours(value, gcf)),
    [EnergyUnits.WattHours]: (value, gcf) => ccfToWattHours(value, gcf),
    [VolumeUnits.CCF]: value => value,
    [VolumeUnits.Cubic_Feet]: value => ccfToCubicFeet(value),
    [VolumeUnits.Cubic_Metres]: value => ccfToCubicMetres(value),
    [VolumeUnits.Litres]: value => cubicMetresToLitres(ccfToCubicMetres(value)),
    [VolumeUnits.MCF]: value => cubicFeetToMcf(ccfToCubicFeet(value))
  },
  [VolumeUnits.Cubic_Feet]: {
    [EnergyUnits.Calories]: (value, gcf) => wattHoursToCalories(cubicFeetToWattHours(value, gcf)),
    [EnergyUnits.Joules]: (value, gcf) => wattHoursToJoules(cubicFeetToWattHours(value, gcf)),
    [EnergyUnits.WattHours]: (value, gcf) => cubicFeetToWattHours(value, gcf),
    [VolumeUnits.CCF]: value => cubicFeetToCcf(value),
    [VolumeUnits.Cubic_Feet]: value => value,
    [VolumeUnits.Cubic_Metres]: value => cubicFeetToCubicMetres(value),
    [VolumeUnits.Litres]: value => cubicMetresToLitres(cubicFeetToCubicMetres(value)),
    [VolumeUnits.MCF]: value => cubicFeetToMcf(value)
  },
  [VolumeUnits.Cubic_Metres]: {
    [EnergyUnits.Calories]: (value, gcf) => wattHoursToCalories(cubicMetresToWattHours(value, gcf)),
    [EnergyUnits.Joules]: (value, gcf) => wattHoursToJoules(cubicMetresToWattHours(value, gcf)),
    [EnergyUnits.WattHours]: (value, gcf) => cubicMetresToWattHours(value, gcf),
    [VolumeUnits.CCF]: value => cubicFeetToCcf(cubicMetresToCubicFeet(value)),
    [VolumeUnits.Cubic_Feet]: value => cubicMetresToCubicFeet(value),
    [VolumeUnits.Cubic_Metres]: value => value,
    [VolumeUnits.Litres]: value => cubicMetresToLitres(value),
    [VolumeUnits.MCF]: value => cubicFeetToMcf(cubicMetresToCubicFeet(value))
  },
  [VolumeUnits.Litres]: {
    [EnergyUnits.Calories]: (value, gcf) => wattHoursToCalories(litresToWattHours(value, gcf)),
    [EnergyUnits.Joules]: (value, gcf) => wattHoursToJoules(litresToWattHours(value, gcf)),
    [EnergyUnits.WattHours]: (value, gcf) => litresToWattHours(value, gcf),
    [VolumeUnits.CCF]: value => cubicFeetToCcf(litresToCubicFeet(value)),
    [VolumeUnits.Cubic_Feet]: value => litresToCubicFeet(value),
    [VolumeUnits.Cubic_Metres]: value => litresToCubicMetres(value),
    [VolumeUnits.Litres]: value => value,
    [VolumeUnits.MCF]: value => cubicFeetToMcf(litresToCubicFeet(value))
  },
  [VolumeUnits.MCF]: {
    [EnergyUnits.Calories]: (value, gcf) => wattHoursToCalories(mcfToWattHours(value, gcf)),
    [EnergyUnits.Joules]: (value, gcf) => wattHoursToJoules(mcfToWattHours(value, gcf)),
    [EnergyUnits.WattHours]: (value, gcf) => mcfToWattHours(value, gcf),
    [VolumeUnits.CCF]: value => cubicFeetToCcf(mcfToCubicFeet(value)),
    [VolumeUnits.Cubic_Feet]: value => mcfToCubicFeet(value),
    [VolumeUnits.Cubic_Metres]: value => mcfToCubicMetres(value),
    [VolumeUnits.Litres]: value => cubicMetresToLitres(mcfToCubicMetres(value)),
    [VolumeUnits.MCF]: value => value
  }
};
