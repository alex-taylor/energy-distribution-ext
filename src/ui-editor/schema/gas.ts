import { EditorPages, EnergyFlowCardExtConfig, GasConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { GAS_ENTITY_CLASSES } from '@/const';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';

export function gasSchema(config: EnergyFlowCardExtConfig): any[] {
  const gasConfig: GasConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Gas);
  return nodeConfigSchema(config, gasConfig, singleValueNodeSchema(config, gasConfig, GAS_ENTITY_CLASSES));
}
