import { Assembler, Automaton, Emptier, Filter, Redirector, Waiter } from "./automata";
import { Gold } from "./crafting";
import { Upgrade } from "./game";
import { Bank, Whetstone } from "./objects";

export class SturdyUpgrade extends Upgrade {
  sprite = "upgrade_sturdy" as const;
  name = "Sturdy";
  description = "Dwarves have 3 health";
  requires = [];

  apply() {
    game.modifiers.warriorBaseHealth = 3;
  }
}

export class NimbleUpgrade extends Upgrade {
  sprite = "upgrade_nimble" as const;
  name = "Nimble";
  description = "50% chance for dwarves to take no damage";
  requires = []

  apply() {
    game.modifiers.damageReductionChance = 0.5;
  }
}

export class RallyUpgrade extends Upgrade {
  sprite = "upgrade_rally" as const;
  name = "Rally";
  description = "2x damage when adjacent to another dwarf";
  requires = [];

  apply() {
    // TODO:
  }
}

export class HeadhunterUpgrade extends Upgrade {
  sprite = "upgrade_headhunter" as const;
  name = "Headhunter";
  description = "Goblins drop valuables";
  requires = [];

  apply() {
    // TODO:
  }
}

export class BloodlustUpgrade extends Upgrade {
  sprite = "upgrade_bloodlust" as const;
  name = "Bloodlust";
  description = "25% chance to heal after attack";
  requires = [];

  apply() {
  }
}

export class ProspectorUpgrade extends Upgrade {
  sprite = "upgrade_prospector" as const;
  name = "Prospector";
  description = "Unlocks gold mining";
  requires = [];

  apply() {
    game.modifiers.unlockedElements.push(Gold);
  }
}

export class ClockworkUpgrade extends Upgrade {
  sprite = "upgrade_clockwork" as const;
  name = "Clockwork";
  description = "Unlocks automatons";
  requires = [ProspectorUpgrade];

  apply() {
    game.shop.unlock(Assembler);
    game.shop.unlock(Automaton);
    game.shop.unlock(Waiter);
    game.shop.unlock(Redirector);
    game.shop.unlock(Emptier);
    game.shop.unlock(Filter);
  }
}

export class HaggleUpgrade extends Upgrade {
  sprite = "upgrade_haggle" as const;
  amount = 0.2;
  name = "Haggle";
  description = "+20% to trade prices";
  requires = [];

  apply() {
    game.modifiers.baseTradePriceMultiplier = this.amount;
  }
}

export class InvestmentUpgrade extends Upgrade {
  sprite = "upgrade_investment" as const;
  name = "Investment";
  description = "Unlocks Banks";
  requires = [ProspectorUpgrade];

  apply() {
    game.shop.unlock(Bank);
  }
}

export class ShortcutUpgrade extends Upgrade {
  sprite = "upgrade_shortcut" as const;
  name = "Shortcut";
  description = "20% chance for anvils to craft a sword";
  requires = [];

  apply() {
    game.modifiers.anvilCraftSwordChance = 0.2;
  }
}

export class FlairUpgrade extends Upgrade {
  sprite = "upgrade_flair" as const;
  name = "Flair";
  description = "Unlocks the whetstone";
  requires = [];

  apply() {
    game.shop.unlock(Whetstone);
  }
}

export class RenownUpgrade extends Upgrade {
  sprite = "upgrade_renown" as const;
  name = "Renown";
  description = "300% bonus for swords from a set";
  requires = [FlairUpgrade];

  apply() {
    game.modifiers.baseSetBonusMultiplier = 3;
  }
}

export class MidasUpgrade extends Upgrade {
  sprite = "upgrade_midas" as const;
  name = "Midas";
  description = "10% chance for iron ore to become a gold bar";
  requires = [ProspectorUpgrade];

  apply() {
    // TODO:
  }
}

export class ArchaicUpgrade extends Upgrade {
  sprite = "upgrade_archaic" as const;
  name = "Archaic";
  description = "Miners can find valuable artifacts";
  requires = [];

  apply() {
    // TODO:
  }
}

export class DiscountUpgrade extends Upgrade {
  sprite = "upgrade_discount" as const;
  name = "Discount";
  description = "20% shop discount";
  requires = [];

  apply() {
    game.modifiers.baseShopDiscount = 0.2;
  }
}
