import { EditorPages, EnergyFlowCardExtConfig } from '@/config';
import { nodeConfigSchema, singleValueNodeSchema } from '.';

export function gasSchema(config: EnergyFlowCardExtConfig | undefined): any[] {
  return nodeConfigSchema(config, config?.[EditorPages.Gas], singleValueNodeSchema(config, config?.[EditorPages.Gas]));
}
