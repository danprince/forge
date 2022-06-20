import "./style.css";
import { Game, Material } from "./game";
import { UI } from "./ui";
import { init, shuffled } from "./engine";
import { Bar, Gold, Iron, Ore, Sword } from "./crafting";
import { Anvil, Assembler, Automaton, Bank, Bucket, Emptier, Filter, Furnace, Goblin, GoblinBrute, GoblinLooter, GoblinShaman, GoblinTotem, Healer, Mule, Redirector, Waiter, Warrior, Whetstone } from "./objects";
import "./crafting";
import { SpawnOre } from "./actions";
import { GoblinRaid } from "./events";
import { GameView } from "./views";
import { ArchaicUpgrade, BloodlustUpgrade, ClockworkUpgrade, DiscountUpgrade, FlairUpgrade, HaggleUpgrade, HeadhunterUpgrade, InvestmentUpgrade, MidasUpgrade, NimbleUpgrade, ProspectorUpgrade, RallyUpgrade, RenownUpgrade, ShortcutUpgrade, SturdyUpgrade } from "./upgrades";

new Game(11, 11);
new UI(320, 180);

game.addRecipe(Sword);

// Events
game.addEventToPool(GoblinRaid);

// Upgrades
game.addUpgradeToPool(new SturdyUpgrade);
game.addUpgradeToPool(new NimbleUpgrade);
game.addUpgradeToPool(new RallyUpgrade);
game.addUpgradeToPool(new HeadhunterUpgrade);
game.addUpgradeToPool(new BloodlustUpgrade);
game.addUpgradeToPool(new ProspectorUpgrade);
game.addUpgradeToPool(new ClockworkUpgrade);
game.addUpgradeToPool(new HaggleUpgrade);
game.addUpgradeToPool(new InvestmentUpgrade);
game.addUpgradeToPool(new ShortcutUpgrade);
game.addUpgradeToPool(new RenownUpgrade);
game.addUpgradeToPool(new MidasUpgrade);
game.addUpgradeToPool(new ArchaicUpgrade);
game.addUpgradeToPool(new DiscountUpgrade);
game.addUpgradeToPool(new FlairUpgrade);

// Shop
//            Sprite                   Coins  Swords  Create
game.shop.add("mule_idle_1",           50,     0,     () => new Mule());
game.shop.add("furnace",               20,     0,     () => new Furnace());
game.shop.add("anvil",                 20,     0,     () => new Anvil());
game.shop.add("whetstone_1",           75,     0,     () => new Whetstone());
game.shop.add("assembler_1",           20,     0,     () => new Assembler());
game.shop.add("bank",                 100,     0,     () => new Bank());
game.shop.add("logic_redirector",      20,     0,     () => new Redirector());
game.shop.add("logic_emptier",         20,     0,     () => new Emptier());
game.shop.add("logic_waiter",          20,     0,     () => new Waiter());
game.shop.add("logic_filter",          20,     0,     () => new Filter());
game.shop.add("automaton_idle_1",      20,     0,     () => new Automaton());
game.shop.add("dwarf_warrior_idle_1",  10,     1,     () => new Warrior());
game.shop.add("dwarf_healer_idle_1",   50,     0,     () => new Healer());
game.shop.add("goblin_runt_idle_1",     0,     0,     () => new Goblin());
game.shop.add("goblin_shaman_idle_1",   0,     0,     () => new GoblinShaman());
game.shop.add("goblin_brute_idle_1",    0,     0,     () => new GoblinBrute());
game.shop.add("goblin_looter_idle_1",   0,     0,     () => new GoblinLooter());
game.shop.add("goblin_totem",           0,     0,     () => new GoblinTotem());
game.shop.add("bar_gold",               0,     0,     () => Material.of(Gold, Bar)!);
game.shop.add("bar_iron",               0,     0,     () => Material.of(Iron, Bar)!);
game.shop.add("ore_gold",               0,     0,     () => Material.of(Gold, Ore)!);
game.shop.add("ore_iron",               0,     0,     () => Material.of(Iron, Ore)!);

// Initial shop unlocks
game.shop.unlock(Furnace);
game.shop.unlock(Anvil);
game.shop.unlock(Mule);
game.shop.unlock(Warrior);

let cells = shuffled(game.cells);

for (let i = 0; i < 1; i++) {
  let cell = cells.pop()!;
  game.addObject(new Furnace(), cell.x, cell.y);
}

for (let i = 0; i < 1; i++) {
  let cell = cells.pop()!;
  game.addObject(new Anvil(), cell.x, cell.y);
}

for (let i = 0; i < 1; i++) {
  let cell = cells.pop()!;
  game.addObject(new Mule(), cell.x, cell.y);
}

for (let i = 0; i < 4; i++) {
  let cell = cells.pop();
  if (cell) game.addObject(new Bucket(), cell.x, cell.y);
}

for (let i = 0; i < 20; i++) {
  let cell = cells.pop();
  let ore = Material.createByRarity({ component: Ore });
  if (cell && ore) game.addObject(ore, cell.x, cell.y);
}

game.swords = 3;
game.coins = 999;
game.addAction(new SpawnOre());

ui.open(new GameView);
init(ui.update);
