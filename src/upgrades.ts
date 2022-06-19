import { Upgrade } from "./game";

export class PackMule extends Upgrade {
  sprite = "mule_idle_1" as const;
  name = "Pack Mule";
  description = "Mules can pickup items";
  apply() {
    // TODO:
  }
}