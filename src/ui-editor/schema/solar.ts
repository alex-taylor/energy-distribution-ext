import { EditorPages, EnergyFlowCardExtConfig, SolarConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';
import { DisplayMode, ELECTRIC_ENTITY_CLASSES } from '@/enums';
import { DEFAULT_CONFIG, getConfigValue } from '@/config/config';
import memoizeOne from 'memoize-one';

export const solarSchema = memoizeOne((config: EnergyFlowCardExtConfig, mode: DisplayMode, secondaryEntities: string[]): any[] => {
  const solarConfig: SolarConfig = getConfigValue([config, DEFAULT_CONFIG], EditorPages.Solar);
  return nodeConfigSchema(singleValueNodeSchema(solarConfig, mode, EditorPages.Solar, ELECTRIC_ENTITY_CLASSES, true), secondaryEntities);
});
