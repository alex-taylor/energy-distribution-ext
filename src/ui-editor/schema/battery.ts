import { BatteryConfig, EditorPages, EnergyFlowCardExtConfig } from '@/config';
import { dualValueNodeSchema, nodeConfigSchema } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';
import { DisplayMode } from '@/enums';

export const batterySchema = memoizeOne((config: EnergyFlowCardExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const batteryConfig: BatteryConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Battery);
  return nodeConfigSchema(dualValueNodeSchema(batteryConfig, mode, EditorPages.Battery), secondaryEntities);
});
