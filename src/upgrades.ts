import { Upgrade } from "./game";
import { Mule } from "./objects";

export class PackMule extends Upgrade {
  sprite = "pack_mule" as const;
  name = "Pack Mule";
  description = "Mules can pickup items";
  apply() {
    Mule.prototype.onBump = Mule.prototype.onAccept;
  }
}