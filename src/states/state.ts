import { DualValueNodeConfig, EntitiesOptions, EntityOptions, filterPrimaryEntities, NodeConfig, OverridesOptions, SingleValueNodeConfig } from "@/config";
import { HomeAssistant } from "custom-card-helpers";
import { State } from ".";
import { ELECTRIC_ENTITY_CLASSES } from "@/const";
import { SecondaryInfoState } from "./secondary-info";
import { getConfigValue } from "@/config/config";

export abstract class ValueState extends State {
  public name: string;
  public secondary: SecondaryInfoState;

  protected constructor(hass: HomeAssistant, config: NodeConfig[], importEntities: string[], defaultName: string, defaultIcon: string) {
    super(config, importEntities, defaultIcon);
    this.name = getConfigValue(config, [EntitiesOptions.Overrides, OverridesOptions.Name]) || defaultName;
    this.secondary = new SecondaryInfoState(hass, getConfigValue(config, EntitiesOptions.Secondary_Info));
  }
}

export abstract class SingleValueState extends ValueState {
  public state: {
    import: number;
    importVolume: number;
  };

  protected constructor(hass: HomeAssistant, config: SingleValueNodeConfig[], hassEntityIds: string[], defaultName: string, defaultIcon: string, deviceClasses: string[]) {
    super(
      hass,
      config,
      filterPrimaryEntities(hass, [...hassEntityIds, ...(getConfigValue(config, [EntitiesOptions.Entities, EntityOptions.Entity_Ids]))], deviceClasses),
      defaultName,
      defaultIcon
    );

    this.state = {
      import: 0,
      importVolume: 0
    };

    this.rawEntities.push(...(getConfigValue(config, [EntitiesOptions.Entities, EntityOptions.Entity_Ids])));
    this.hassConfigPresent = hassEntityIds.length !== 0;
  }
}

export abstract class DualValueState extends ValueState {
  public exportEntities: string[]
  public firstExportEntity?: string;

  protected constructor(hass: HomeAssistant, config: DualValueNodeConfig[], hassImportEntityIds: string[], hassExportEntityIds: string[], defaultName: string, defaultIcon: string) {
    super(
      hass,
      config,
      filterPrimaryEntities(hass, [...hassImportEntityIds, ...(getConfigValue(config, [EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids]))], ELECTRIC_ENTITY_CLASSES),
      defaultName,
      defaultIcon
    );

    const exportEntities: string[] = getConfigValue(config, [EntitiesOptions.Export_Entities, EntityOptions.Entity_Ids]);

    this.rawEntities.push(...(getConfigValue(config, [EntitiesOptions.Import_Entities, EntityOptions.Entity_Ids])));
    this.rawEntities.push(...exportEntities);
    this.exportEntities = filterPrimaryEntities(hass, [...hassExportEntityIds, ...exportEntities], ELECTRIC_ENTITY_CLASSES);
    this.firstExportEntity = this.exportEntities.length !== 0 ? this.exportEntities[0] : undefined;
    this.isPresent = this.isPresent || this.exportEntities.length !== 0;
    this.hassConfigPresent = hassImportEntityIds.length !== 0 || hassExportEntityIds.length !== 0;
  }
}
