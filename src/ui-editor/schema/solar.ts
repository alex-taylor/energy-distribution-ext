import { EditorPages, EnergyFlowCardExtConfig, SolarConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { ELECTRIC_ENTITY_CLASSES } from '@/const';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';

export function solarSchema(config: EnergyFlowCardExtConfig): any[] {
  const solarConfig: SolarConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Solar);
  return nodeConfigSchema(config, solarConfig, singleValueNodeSchema(config, solarConfig, ELECTRIC_ENTITY_CLASSES, true));
}
