import {
  createEmptyImportResult,
  type DetectedTextImportSections,
  type ImportResult,
  type ParsedSkillEntry,
  type SkillGroupName,
} from "@/domain/import/types";
import {
  canonicalFieldText,
  isPlaceholderText,
} from "@/domain/import/normalizer";

export function parseTextImportSkills(
  sections: DetectedTextImportSections,
): ImportResult {
  const result = createEmptyImportResult();
  const skillsText = sections.sectionContents.skills;
  if (!skillsText) return result;

  let currentGroup: SkillGroupName | undefined;
  const supportedGroupsWithSkills = new Set<SkillGroupName>();
  const encounteredSupportedGroups = new Set<SkillGroupName>();
  const encounteredUnsupportedGroups = new Set<string>();

  for (const line of skillsText.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed.length === 0 ||
      trimmed.toLowerCase().includes("all % are with category modifiers")
    ) {
      continue;
    }

    const header = parseGroupHeader(trimmed);
    if (header) {
      if (header.type === "supported") {
        currentGroup = header.group;
        encounteredSupportedGroups.add(header.group);
      } else {
        currentGroup = undefined;
        encounteredUnsupportedGroups.add(header.title);
      }
      continue;
    }

    if (!currentGroup) continue;
    const skill = parseSkillLine(trimmed, currentGroup);
    if (!skill) continue;
    result.skills.push(skill);
    supportedGroupsWithSkills.add(currentGroup);
  }

  result.coverage.foundSkills = result.skills.length;
  result.coverage.foundSkillGroups = supportedGroupsWithSkills.size;
  result.coverage.expectedSkillGroups =
    encounteredSupportedGroups.size + encounteredUnsupportedGroups.size;
  result.coverage.unsupportedSkillGroups = encounteredUnsupportedGroups.size;

  return result;
}

export const parseSkillImportSections = parseTextImportSkills;

function parseSkillLine(
  line: string,
  group: SkillGroupName,
): ParsedSkillEntry | undefined {
  const match = line.match(/^(.*?)([0-9]+)%/u);
  if (!match) return undefined;

  const name = match[1].replace(/\s+/g, " ").trim();
  const percentage = Number.parseInt(match[2], 10);
  if (
    name.length === 0 ||
    Number.isNaN(percentage) ||
    containsPlaceholder(name)
  ) {
    return undefined;
  }

  return {
    name,
    groupName: group,
    percentage,
    isCustom: !knownSkillNames[group].has(normalizeSkillName(name)),
    experienceCheck: /\[x\]/iu.test(line),
  };
}

function containsPlaceholder(name: string): boolean {
  return name
    .split(/[ :()]/u)
    .some((token) => token.trim().length > 0 && isPlaceholderText(token.trim()));
}

function parseGroupHeader(
  line: string,
):
  | { type: "supported"; group: SkillGroupName }
  | { type: "unsupported"; title: string }
  | undefined {
  const canonical = canonicalFieldText(line);
  if (!/[+-][0-9]+%$/u.test(canonical)) {
    return undefined;
  }

  const title = canonical.replace(/\s*[+-][0-9]+%$/u, "");
  switch (title.toLowerCase()) {
    case "agility":
    case "communication":
    case "knowledge":
    case "magic":
    case "manipulation":
    case "perception":
    case "stealth":
      return { type: "supported", group: title.toLowerCase() as SkillGroupName };
    default:
      return { type: "unsupported", title };
  }
}

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

const knownSkillNames: Record<SkillGroupName, Set<string>> = {
  agility: new Set([
    "boat",
    "climb",
    "dodge",
    "drive chariot",
    "jump",
    "ride (mount type)",
    "swim",
  ]),
  communication: new Set([
    "act",
    "art",
    "bargain",
    "charm",
    "dance",
    "disguise",
    "fast talk",
    "intimidate",
    "intrigue",
    "orate",
    "sing",
    "speak own language",
    "speak other language",
  ]),
  knowledge: new Set([
    "alchemy",
    "animal lore",
    "battle",
    "bureaucracy",
    "celestial lore",
    "cult lore (specific cult)",
    "customs",
    "elder race lore (race)",
    "evaluate",
    "farm",
    "first aid",
    "game",
    "herd",
    "homeland lore (local)",
    "homeland lore (other)",
    "library use",
    "manage household",
    "mineral lore",
    "peaceful cut",
    "plant lore",
    "read/write (language)",
    "shiphandling",
    "survival",
    "treat disease",
    "treat poison",
  ]),
  magic: new Set([
    "meditate",
    "prepare corpse",
    "sense assassin",
    "sense chaos",
    "spirit combat",
    "spirit dance",
    "spirit lore",
    "spirit travel",
    "understand herd beast",
    "worship (deity)",
  ]),
  manipulation: new Set([
    "conceal",
    "craft (specific craft)",
    "devise",
    "melee weapon",
    "missile weapon",
    "play instrument",
    "shield",
    "sleight",
  ]),
  perception: new Set(["insight", "listen", "scan", "search", "track"]),
  stealth: new Set(["hide", "move quietly"]),
};
