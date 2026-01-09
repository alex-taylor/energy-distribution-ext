import { BatteryConfig, EditorPages, EnergyFlowCardExtConfig } from '@/config';
import { dualValueNodeSchema, nodeConfigSchema } from '.';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';

export function batterySchema(config: EnergyFlowCardExtConfig): any[] {
  const batteryConfig: BatteryConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Battery);
  return nodeConfigSchema(config, batteryConfig, dualValueNodeSchema(config, batteryConfig));
}
