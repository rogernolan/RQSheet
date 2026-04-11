import { getDamageBonusText, getMaxHitPoints } from "@/domain/character";
import { formatGloranthanDate } from "@/domain/glorantha-date";
import { getSkillEffectiveValue, getSkillGroupBonus, getSkillGroupOrder, getSkillGroupTitle } from "@/domain/skills";
import { classifySpellSource } from "@/domain/magic";
import type { RuneName } from "@/domain/import/types";
import type { Character, CharacterSkillRecord, CharacterWeaponRecord } from "@/domain/types";

const elementalRuneRows: Array<{ key: RuneName; label: string }> = [
  { key: "air", label: "Air" },
  { key: "fire", label: "Fire/Sky" },
  { key: "darkness", label: "Darkness" },
  { key: "water", label: "Water" },
  { key: "earth", label: "Earth" },
  { key: "moon", label: "Moon" },
];

const pairedRuneRows: Array<{ left: RuneName; right: RuneName; leftLabel: string; rightLabel: string }> = [
  { left: "beast", right: "man", leftLabel: "Beast", rightLabel: "Man" },
  { left: "fertility", right: "death", leftLabel: "Fertility", rightLabel: "Death" },
  { left: "harmony", right: "disorder", leftLabel: "Harmony", rightLabel: "Disorder" },
  { left: "truth", right: "illusion", leftLabel: "Truth", rightLabel: "Illusion" },
  { left: "stasis", right: "movement", leftLabel: "Stasis", rightLabel: "Movement" },
];

const commonRuneSpellCatalog = [
  { name: "Command Cult Spirit", pointsText: "2" },
  { name: "Dismiss Magic", pointsText: "1" },
  { name: "Divination", pointsText: "1" },
  { name: "Extension", pointsText: "1" },
  { name: "Find Enemy", pointsText: "1" },
  { name: "Heal Wound", pointsText: "1" },
  { name: "Multispell", pointsText: "1" },
  { name: "Sanctify", pointsText: "1" },
  { name: "Soul Sight", pointsText: "1" },
  { name: "Spirit Block", pointsText: "1" },
  { name: "Summon Cult Spirit", pointsText: "1-3" },
  { name: "Warding", pointsText: "1" },
] as const;

export function formatCharacterForBGG(character: Character): string {
  const spiritSpells = character.magic.filter((spell) => classifySpellSource(spell.source) === "spirit");
  const runeSpells = character.magic.filter((spell) => classifySpellSource(spell.source) === "rune");
  const hpTotal = getMaxHitPoints(character);
  const cultName = character.worships.trim().length > 0 ? character.worships.trim() : "____________";

  return [
    "[/COLOR][/center]",
    "",
    `[c]Name: [u]${formatUnderline(character.name)}[/u]   Clan: [u]${formatUnderline(character.family)}[/u]   Tribe: [u]${formatUnderline(character.tribe)}[/u]   Born: ${formatBorn(character)}`,
    "",
    `Reputation: ${formatTwoDigit(character.reputation)}%  Occupation: ${formatTextOrPlaceholder(character.occupation)}  SoL: ${formatTextOrPlaceholder(character.sol)}  Income: ${formatIncome(character.income)}  Ransom: ${formatRansom(character.ransom)}`,
    "",
    `Cult: [u]Initiate of ${cultName}[/u] [microbadge=42743][microbadge=38208]`,
    ...formatGiftGeasLines("Gift", 45963, character.gifts),
    ...formatGiftGeasLines("Geas", 45962, character.geases),
    "",
    `[floatleft][b][u]Characteristics[/u][/b]  `,
    `STR: ${formatTwoDigit(character.str)}`,
    `INT: ${formatTwoDigit(character.int)}`,
    `SIZ: ${formatTwoDigit(character.siz)}`,
    `DEX: ${formatTwoDigit(character.dex)}`,
    `CON: ${formatTwoDigit(character.con)}`,
    `POW: ${formatTwoDigit(character.pow)} ${formatCheckbox(character.powExperienceCheck)}`,
    `CHA: ${formatTwoDigit(character.cha)}`,
    `[/floatleft][floatleft][b][u]Elemental Runes   [/u][/b]  `,
    ...elementalRuneRows.map(
      ({ key, label }) =>
        `${`${label}:`.padEnd(10, " ")} ${formatTwoDigit(character.runePercentages[key] ?? 0)} ${formatCheckbox(Boolean(character.runeExperienceChecks[key]))}`,
    ),
    "",
    `[/floatleft][floatleft][b][u]Power Rune Affinities             [/u]  [/b]`,
    ...pairedRuneRows.map(({ left, right, leftLabel, rightLabel }) => {
      const leftValue = formatTwoDigit(character.runePercentages[left] ?? 50);
      const rightValue = formatTwoDigit(character.runePercentages[right] ?? 50);
      return `${formatCheckbox(Boolean(character.runeExperienceChecks[left]))} ${leftValue} ${leftLabel.padStart(10, " ")} | ${rightLabel.padEnd(10, " ")} ${rightValue} ${formatCheckbox(Boolean(character.runeExperienceChecks[right]))}`;
    }),
    "   [i]Paired runes must total 100%[/i]",
    "",
    `[/floatleft][floatleft][u][b]Passions                   [/b][/u]`,
    ...formatPassions(character),
    " [/floatleft][/c]",
    "[hr]",
    `[c][floatleft]           ${formatTwoDigit(hpTotal)} HP Total / currently: __`,
    "",
    ...character.hitLocations.map((location) => formatHitLocation(location.range, shortHitLocationLabel(location.label), location.armour, location.maxHP, location.currentHP)),
    "",
    "Healing Rate: #/week",
    `[/floatleft][floatleft]Dex SR: #  Siz SR: #  ${formatSignedForExport(getSkillGroupBonus(character, "manipulation"))}% Manip Bonus   Damage Bonus: ${getDamageBonusText(character)}`,
    "",
    "[u][b]Weapon           SR    Hit%     Damage   Range  HP/curr[/b][/u]",
    ...formatWeapons(character.weapons),
    "",
    "[/floatleft][/c]",
    "[hr]",
    ...formatSkillColumns(character),
    "[hr]",
    `[c][floatleft][u][b]Rune Magic              [/b][/u]    `,
    `Cult: ${cultName}`,
    `Rune Points:        ${character.runePoints}/${character.runePoints}`,
    "",
    `[u]CULTNAME Spells    (RPs)[/u]`,
    ...formatSpells(runeSpells),
    "",
    `[u]Common Rune Spells (RPs)[/u]`,
    ...commonRuneSpellCatalog.map((spell) => `${spell.name.padEnd(20, " ")} (${spell.pointsText})`),
    "",
    `[/floatleft][floatleft][u][b]Spirit Magic        [/b][/u]    `,
    `Casting @ POWx5 ${formatTwoDigit(character.pow * 5)}%`,
    `CHA Spell Limit: ${formatTwoDigit(Math.max(1, character.cha))}`,
    "",
    `[u]Spells in Mind (pts)[/u]`,
    ...formatSpells(spiritSpells),
    "",
    `[u]Matrix Spells  (pts)[/u]`,
    "_______________ (_)",
    "",
    `[u]Spells Known   (pts)[/u]`,
    "_______________ (_)",
    "",
    `[/floatleft][floatleft][u][b]Spirit Combat   [/b][/u]   `,
    `Magic Points: ${formatTwoDigit(character.pow)}`,
    `Current MPs:  ${formatTwoDigit(character.currentMagicPoints)}   `,
    "Recover #/6 hrs.",
    "",
    `SR12 `,
    "Magic Bonus +00%  ",
    `Attack       ${formatTwoDigit(getSkillValueByName(character, "Spirit Combat"))}% ${formatCheckbox(getSkillExperienceCheckByName(character, "Spirit Combat"))} `,
    `Damage:      1d#`,
    `[/floatleft][floatleft][u][b]Sorcery        [/b][/u]`,
    "Free INT: __",
    "[/floatleft][/c]",
    "",
    "[c]",
    "[u]Equipment[/u]",
    ...formatEquipment(character),
    "[/c]",
  ].join("\n");
}

function formatPassions(character: Character): string[] {
  if (character.passions.length === 0) {
    return ["__________________: __% [ ]"];
  }

  return character.passions
    .slice()
    .sort((lhs, rhs) => rhs.percentage - lhs.percentage)
    .map(
      (passion) =>
        `${`${passion.name}:`.padEnd(22, " ")} ${formatTwoDigit(passion.percentage)}% ${formatCheckbox(Boolean(passion.experienceCheck))}`,
    );
}

function formatHitLocation(
  range: string,
  label: string,
  armour: number,
  maxHP: number,
  currentHP: number,
): string {
  return `${range}: ${label.padEnd(5, " ")} ${formatSingleDigit(armour)} AP / ${formatSingleDigit(maxHP)} HP / currently: ${formatSingleDigit(currentHP)}`;
}

function formatWeapons(weapons: CharacterWeaponRecord[]): string[] {
  if (weapons.length === 0) {
    return ["_______________    _    __% [ ]  ______     __      _/_"];
  }

  return weapons.map((weapon) => {
    const range = weapon.range?.trim() || "";
    const hpCurrent = weapon.hpCurrent ? String(weapon.hpCurrent) : "";
    const hpMax = weapon.hpMax ? String(weapon.hpMax) : "";
    return `${weapon.name.padEnd(18, " ")} ${`${weapon.strikeRank || "#"}`.padStart(4, " ")}    ${formatTwoDigit(weapon.percentage)}% ${formatCheckbox(Boolean(weapon.experienceCheck))}  ${(weapon.damage || "").padEnd(8, " ")} ${range.padStart(5, " ")}      ${hpMax}/${hpCurrent}`;
  });
}

function formatSkillColumns(character: Character): string[] {
  const grouped = getSkillGroupOrder().map((group) => ({
    group,
    title: getSkillGroupTitle(group),
    bonus: getSkillGroupBonus(character, group),
    lines: character.skills
      .filter((skill) => skill.group === group)
      .map((skill) => formatSkill(skill, getSkillEffectiveValue(character, skill))),
  }));

  const leftGroups = grouped.filter(({ group }) =>
    ["agility", "communication"].includes(group),
  );
  const middleGroups = grouped.filter(({ group }) =>
    ["knowledge"].includes(group),
  );
  const rightGroups = grouped.filter(({ group }) =>
    ["magic", "manipulation", "perception", "stealth"].includes(group),
  );

  return [
    `[c][floatleft]${leftGroups.map(formatSkillGroupBlock).join("\n\n")}`,
    `[/floatleft][floatleft]${middleGroups.map(formatSkillGroupBlock).join("\n\n")}`,
    `[/floatleft][floatleft]${rightGroups.map(formatSkillGroupBlock).join("\n\n")}`,
    "[/floatleft][/c]",
  ];
}

function formatSkillGroupBlock(group: {
  title: string;
  bonus: number;
  lines: string[];
}): string {
  return [`[u][b]${group.title}[/b][/u]            ${formatSignedForExport(group.bonus)}%`, ...group.lines].join("\n");
}

function formatSkill(skill: CharacterSkillRecord, effectiveValue: number): string {
  return `${skill.name.padEnd(20, " ")} ${formatTwoDigit(effectiveValue)}% ${formatCheckbox(skill.experienceCheck)}`;
}

function formatSpells(spells: Character["magic"]): string[] {
  if (spells.length === 0) {
    return ["                (_)"];
  }

  return spells.map((spell) => `${spell.name.padEnd(16, " ")} (${spell.points})`);
}

function formatEquipment(character: Character): string[] {
  if (character.equipment.length === 0) {
    return ["_______________"];
  }

  return character.equipment.map((item) => item.name);
}

function getSkillValueByName(character: Character, name: string): number {
  const skill = character.skills.find((entry) => entry.name === name);
  return skill ? getSkillEffectiveValue(character, skill) : 0;
}

function getSkillExperienceCheckByName(character: Character, name: string): boolean {
  return Boolean(character.skills.find((entry) => entry.name === name)?.experienceCheck);
}

function shortHitLocationLabel(label: string): string {
  switch (label) {
    case "Left Arm":
      return "L Arm";
    case "Right Arm":
      return "R Arm";
    case "Left Leg":
      return "L Leg";
    case "Right Leg":
      return "R Leg";
    case "Abdomen":
      return "Abdmn";
    default:
      return label;
  }
}

function formatCheckbox(value: boolean): string {
  return value ? "[x]" : "[ ]";
}

function formatGiftGeasLines(
  label: "Gift" | "Geas",
  badgeId: number,
  values: string[],
): string[] {
  if (values.length === 0) {
    return [`[microbadge=${badgeId}] ${label}:  `];
  }

  return values.map((value, index) =>
    index === 0
      ? `[microbadge=${badgeId}] ${label}: ${value}`
      : `                  ${value}`,
  );
}

function formatTextOrPlaceholder(value: string): string {
  return value.trim().length > 0 ? value : "_____";
}

function formatUnderline(value: string): string {
  return value.trim().length > 0 ? value : "____";
}

function formatBorn(character: Character): string {
  if (
    character.birthDay &&
    character.birthWeek &&
    character.birthSeason &&
    character.birthYear
  ) {
    return formatGloranthanDate({
      day: character.birthDay,
      week: character.birthWeek,
      season: character.birthSeason,
      year: character.birthYear,
    });
  }

  return character.dateOfBirth.trim().length > 0
    ? character.dateOfBirth
    : "[microbadge=37341] day, [microbadge=38208] week, [microbadge=37342] season, 1604";
}

function formatIncome(value: string): string {
  return value.trim().length > 0 ? `${value} L` : "___ L";
}

function formatRansom(value: number): string {
  return value > 0 ? `${value} L` : "_00 L";
}

function formatTwoDigit(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function formatSingleDigit(value: number): string {
  return String(Math.max(0, Math.floor(value)));
}

function formatSignedForExport(value: number): string {
  return value >= 0 ? `+${formatTwoDigit(value)}` : `-${formatTwoDigit(Math.abs(value))}`;
}
