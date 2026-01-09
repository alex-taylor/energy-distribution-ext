import { EditorPages, EnergyFlowCardExtConfig, GasConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { GAS_ENTITY_CLASSES } from '@/const';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const gasSchema = memoizeOne((config: EnergyFlowCardExtConfig): any[] => {
  const gasConfig: GasConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Gas);
  return nodeConfigSchema(singleValueNodeSchema(gasConfig, GAS_ENTITY_CLASSES));
});
