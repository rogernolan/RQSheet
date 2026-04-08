"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getDamageBonusText,
  getDisplayName,
  getMaxMagicPoints,
  getStatisticStripEntries,
} from "@/domain/character";
import { parseTextImport } from "@/domain/import/pipeline";
import { reviewImportResult } from "@/domain/import/types";
import {
  getGroupedSkills,
  getSkillEffectiveValue,
  getSkillGroupBonus,
  getSkillGroupOrder,
  getSkillGroupTitle,
} from "@/domain/skills";
import { classifySpellSource } from "@/domain/magic";
import { getWeaponTypeLabel } from "@/domain/weapons";
import type {
  Character,
  CharacterEquipmentRecord,
  CharacterSkillRecord,
  CharacterWeaponRecord,
} from "@/domain/types";
import { createIndexedDBCharacterRepository } from "@/lib/storage";

const repository = createIndexedDBCharacterRepository();

export function CharacterShell() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCharacterMenuOpen, setIsCharacterMenuOpen] = useState(false);

  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId],
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadCharacters() {
      try {
        const loadedCharacters = await repository.listCharacters();
        if (isCancelled) {
          return;
        }

        setCharacters(loadedCharacters);
        setSelectedCharacterId((currentSelectedId) => {
          if (
            currentSelectedId.length > 0 &&
            loadedCharacters.some((character) => character.id === currentSelectedId)
          ) {
            return currentSelectedId;
          }

          return loadedCharacters[0]?.id ?? "";
        });
        setErrorMessage("");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load local characters.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCharacters();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleCreateCharacter() {
    try {
      const nextCharacter = await repository.createCharacter({
        name: `New Character ${characters.length + 1}`,
      });

      setCharacters((current) => sortCharacters([...current, nextCharacter]));
      setSelectedCharacterId(nextCharacter.id);
      setIsCharacterMenuOpen(false);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create a new character.",
      );
    }
  }

  function handleSelectCharacter(characterId: string) {
    setSelectedCharacterId(characterId);
    setIsCharacterMenuOpen(false);
  }

  async function handleDeleteCharacter(characterId: string) {
    try {
      await repository.deleteCharacter(characterId);

      setCharacters((current) => {
        const index = current.findIndex((character) => character.id === characterId);
        if (index < 0) {
          return current;
        }

        const nextCharacters = current.filter(
          (character) => character.id !== characterId,
        );

        setSelectedCharacterId((currentSelectedId) => {
          if (currentSelectedId !== characterId) {
            return currentSelectedId;
          }

          const replacement =
            nextCharacters[index] ?? nextCharacters[index - 1] ?? nextCharacters[0];
          return replacement?.id ?? "";
        });

        return nextCharacters;
      });
      setIsCharacterMenuOpen(false);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the character.",
      );
    }
  }

  async function handleImportCharacter(rawText: string, nameOverride: string) {
    const parsedResult = parseTextImport(rawText);

    try {
      const importedCharacter = await repository.importCharacter(
        parsedResult,
        nameOverride,
      );

      setCharacters((current) => sortCharacters([...current, importedCharacter]));
      setSelectedCharacterId(importedCharacter.id);
      setErrorMessage("");
      setIsCharacterMenuOpen(false);
      setIsImportOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to import the character.",
      );
    }
  }

  async function handleSaveCharacter(nextCharacter: Character) {
    try {
      await repository.saveCharacter(nextCharacter);
      setCharacters((current) =>
        sortCharacters(
          current.map((character) =>
            character.id === nextCharacter.id ? nextCharacter : character,
          ),
        ),
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save character changes.",
      );
    }
  }

  return (
    <>
      <main className="min-h-screen px-2 py-2 text-foreground sm:px-3 sm:py-3 lg:px-4 lg:py-4">
        <div className="mx-auto min-h-[calc(100vh-1rem)] w-full max-w-[1680px]">
          <section className="relative flex min-w-0 flex-1 flex-col gap-3">
            {isCharacterMenuOpen ? (
              <button
                aria-label="Close character menu"
                className="fixed inset-0 z-20 bg-transparent"
                onClick={() => setIsCharacterMenuOpen(false)}
                type="button"
              />
            ) : null}
            <button
              aria-label="Open character menu"
              className="absolute left-0 top-0 z-30 flex h-10 w-10 items-center justify-center rounded-[10px] border border-panel-border bg-panel shadow-sm backdrop-blur"
              onClick={() => setIsCharacterMenuOpen((current) => !current)}
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className="h-6 w-6 object-contain opacity-75"
                draggable="false"
                height={24}
                src="/rune-man.png"
                width={24}
              />
            </button>
            <WorkspaceHeader
              character={selectedCharacter}
              errorMessage={errorMessage}
              isLoading={isLoading}
              onSaveCharacter={handleSaveCharacter}
            />

            {isCharacterMenuOpen ? (
              <CharacterMenuPopup
                characters={characters}
                errorMessage={errorMessage}
                isLoading={isLoading}
                selectedCharacterId={selectedCharacterId}
                onCreateCharacter={handleCreateCharacter}
                onDeleteCharacter={handleDeleteCharacter}
                onImportCharacter={() => setIsImportOpen(true)}
                onSelectCharacter={handleSelectCharacter}
              />
            ) : null}

            <div className="ml-12 grid flex-1 grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
              <IdentityCard
                key={`identity-${selectedCharacter?.id ?? "empty"}`}
                character={selectedCharacter}
                onSaveCharacter={handleSaveCharacter}
              />
              <CombatCard
                key={`combat-${selectedCharacter?.id ?? "empty"}`}
                character={selectedCharacter}
                onSaveCharacter={handleSaveCharacter}
              />
              <RunesMagicCard
                key={`runes-${selectedCharacter?.id ?? "empty"}`}
                character={selectedCharacter}
                onSaveCharacter={handleSaveCharacter}
              />
            </div>
          </section>
        </div>
      </main>

      {isImportOpen ? (
        <ImportCharacterModal
          onClose={() => setIsImportOpen(false)}
          onImport={handleImportCharacter}
        />
      ) : null}
    </>
  );
}

function CharacterList({
  characters,
  errorMessage,
  isLoading,
  selectedCharacterId,
  onDeleteCharacter,
  onSelectCharacter,
}: {
  characters: Character[];
  errorMessage: string;
  isLoading: boolean;
  selectedCharacterId: string;
  onDeleteCharacter: (characterId: string) => Promise<void>;
  onSelectCharacter: (characterId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <div className="max-w-xs rounded-[18px] border border-dashed border-panel-border p-3 text-sm leading-5 text-stone-600 dark:text-stone-300">
          Loading local characters...
        </div>
      </div>
    );
  }

  if (errorMessage.length > 0) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <div className="max-w-xs rounded-[18px] border border-dashed border-panel-border p-3 text-sm leading-5 text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <div className="max-w-xs rounded-[18px] border border-dashed border-panel-border p-3 text-sm leading-5 text-stone-600 dark:text-stone-300">
          No characters yet. Create one to open the workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="space-y-1.5">
        {characters.map((character) => {
          const isSelected = character.id === selectedCharacterId;

          return (
            <div
              key={character.id}
              className={[
                "flex w-full items-start justify-between gap-2 rounded-[16px] border px-3 py-3 text-left transition",
                isSelected
                  ? "border-stone-900/30 bg-stone-900 text-stone-50 shadow-sm dark:border-stone-100/20 dark:bg-stone-100 dark:text-stone-950"
                  : "border-panel-border bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
              ].join(" ")}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelectCharacter(character.id)}
                type="button"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {getDisplayName(character)}
                    </span>
                  </div>
                  <p
                    className={[
                      "mt-1 truncate text-xs leading-5",
                      isSelected
                        ? "text-stone-200 dark:text-stone-700"
                        : "text-stone-500",
                    ].join(" ")}
                  >
                    {character.worships || "No cults listed"}
                  </p>
                  <p
                    className={[
                      "mt-2 text-[11px] uppercase tracking-[0.18em]",
                      isSelected
                        ? "text-stone-300 dark:text-stone-600"
                        : "text-stone-500",
                    ].join(" ")}
                  >
                    STR {character.str} | DEX {character.dex} | POW {character.pow}
                  </p>
                </div>
              </button>
              <button
                className="min-h-9 rounded-[8px] px-2 py-1 text-[11px] font-medium text-stone-400 transition hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                onClick={() => void onDeleteCharacter(character.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceHeader({
  character,
  errorMessage,
  isLoading,
  onSaveCharacter,
}: {
  character: Character | null;
  errorMessage: string;
  isLoading: boolean;
  onSaveCharacter: (character: Character) => Promise<void>;
}) {
  async function handleSummaryBlur(
    field: "name" | "worships" | "family" | "patron" | "occupation",
    value: string,
  ) {
    if (!character) {
      return;
    }

    await onSaveCharacter({
      ...character,
      [field]: value,
    });
  }

  return (
    <header className="ml-12 rounded-[16px] border border-panel-border bg-panel p-3 shadow-sm backdrop-blur">
      <div className="min-w-0">
        {isLoading ? (
          <h2 className="text-2xl font-semibold tracking-tight">Loading...</h2>
        ) : character ? (
          <HeaderNameField onBlur={handleSummaryBlur} value={character.name} />
        ) : (
          <h2 className="text-2xl font-semibold tracking-tight">
            No character selected
          </h2>
        )}
        {character ? (
          <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-stone-600 md:grid-cols-2 dark:text-stone-300">
            <HeaderSummaryField
              field="worships"
              label="Worships"
              onBlur={handleSummaryBlur}
              value={character.worships}
            />
            <HeaderSummaryField
              field="family"
              label="Family"
              onBlur={handleSummaryBlur}
              value={character.family}
            />
            <HeaderSummaryField
              field="patron"
              label="Patron"
              onBlur={handleSummaryBlur}
              value={character.patron}
            />
            <HeaderSummaryField
              field="occupation"
              label="Occupation"
              onBlur={handleSummaryBlur}
              value={character.occupation}
            />
          </div>
        ) : null}
        {errorMessage.length > 0 ? (
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function CharacterMenuPopup({
  characters,
  errorMessage,
  isLoading,
  selectedCharacterId,
  onCreateCharacter,
  onDeleteCharacter,
  onImportCharacter,
  onSelectCharacter,
}: {
  characters: Character[];
  errorMessage: string;
  isLoading: boolean;
  selectedCharacterId: string;
  onCreateCharacter: () => Promise<void>;
  onDeleteCharacter: (characterId: string) => Promise<void>;
  onImportCharacter: () => void;
  onSelectCharacter: (characterId: string) => void;
}) {
  return (
    <div className="character-menu-pop absolute left-0 top-[4.25rem] z-30 w-full max-w-[360px] origin-top-left rounded-[14px] border border-panel-border bg-panel p-2 shadow-xl backdrop-blur">
      <div className="max-h-[min(60vh,28rem)] overflow-hidden rounded-[10px] bg-black/[0.02] dark:bg-white/[0.03]">
        <CharacterList
          characters={characters}
          errorMessage={errorMessage}
          isLoading={isLoading}
          selectedCharacterId={selectedCharacterId}
          onDeleteCharacter={onDeleteCharacter}
          onSelectCharacter={onSelectCharacter}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-panel-border pt-2">
        <button
          className="min-h-10 rounded-[10px] bg-black/[0.04] px-3 py-2 text-left text-sm font-medium dark:bg-white/[0.06]"
          onClick={() => void onCreateCharacter()}
          type="button"
        >
          New Character
        </button>
        <button
          className="min-h-10 rounded-[10px] bg-black/[0.04] px-3 py-2 text-left text-sm font-medium dark:bg-white/[0.06]"
          onClick={onImportCharacter}
          type="button"
        >
          Import Character
        </button>
      </div>
    </div>
  );
}

function IdentityCard({
  character,
  onSaveCharacter,
}: {
  character: Character | null;
  onSaveCharacter: (character: Character) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => ({
    str: String(character?.str ?? 10),
    con: String(character?.con ?? 10),
    siz: String(character?.siz ?? 10),
    dex: String(character?.dex ?? 10),
    int: String(character?.int ?? 10),
    pow: String(character?.pow ?? 10),
    powExperienceCheck: character?.powExperienceCheck ?? false,
    cha: String(character?.cha ?? 10),
    currentMagicPoints: String(character?.currentMagicPoints ?? 10),
  }));
  const lastSavedKeyRef = useRef("");
  const [skillSearch, setSkillSearch] = useState("");

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextPow = parseNumberDraft(draft.pow, character.pow);
    const nextCharacter = {
      ...character,
      str: parseNumberDraft(draft.str, character.str),
      con: parseNumberDraft(draft.con, character.con),
      siz: parseNumberDraft(draft.siz, character.siz),
      dex: parseNumberDraft(draft.dex, character.dex),
      int: parseNumberDraft(draft.int, character.int),
      pow: nextPow,
      powExperienceCheck: draft.powExperienceCheck,
      cha: parseNumberDraft(draft.cha, character.cha),
      currentMagicPoints: parseNumberDraft(
        draft.currentMagicPoints,
        Math.min(character.currentMagicPoints, nextPow),
      ),
    };
    const saveKey = JSON.stringify([
      nextCharacter.str,
      nextCharacter.con,
      nextCharacter.siz,
      nextCharacter.dex,
      nextCharacter.int,
      nextCharacter.pow,
      nextCharacter.powExperienceCheck,
      nextCharacter.cha,
      nextCharacter.currentMagicPoints,
    ]);
    const currentKey = JSON.stringify([
      character.str,
      character.con,
      character.siz,
      character.dex,
      character.int,
      character.pow,
      character.powExperienceCheck,
      character.cha,
      character.currentMagicPoints,
    ]);

    if (saveKey === currentKey || saveKey === lastSavedKeyRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedKeyRef.current = saveKey;
      void onSaveCharacter(nextCharacter);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, draft, onSaveCharacter]);

  const previewCharacter = useMemo(() => {
    if (!character) {
      return null;
    }

    const nextPow = parseNumberDraft(draft.pow, character.pow);

    return {
      ...character,
      str: parseNumberDraft(draft.str, character.str),
      con: parseNumberDraft(draft.con, character.con),
      siz: parseNumberDraft(draft.siz, character.siz),
      dex: parseNumberDraft(draft.dex, character.dex),
      int: parseNumberDraft(draft.int, character.int),
      pow: nextPow,
      powExperienceCheck: draft.powExperienceCheck,
      cha: parseNumberDraft(draft.cha, character.cha),
      currentMagicPoints: parseNumberDraft(
        draft.currentMagicPoints,
        Math.min(character.currentMagicPoints, nextPow),
      ),
    };
  }, [character, draft]);

  return (
    <DashboardCard>
      {character ? (
        <div className="space-y-2.5">
          <div className="pt-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Statistics
              </h4>
              <span className="text-xs uppercase tracking-[0.14em] text-stone-500">
                Sheet Order
              </span>
            </div>
            <div className="mt-2">
              <div className="grid grid-cols-4 border-y border-panel-border sm:grid-cols-7">
                {getStatisticStripEntries(character).map((entry) => (
                  <StatisticStripCell
                    key={entry.key}
                    label={entry.label}
                    checkboxChecked={
                      entry.key === "pow" ? draft.powExperienceCheck : undefined
                    }
                    checkboxLabel={entry.key === "pow" ? "XP" : undefined}
                    onCheckboxChange={
                      entry.key === "pow"
                        ? (checked) =>
                            setDraft((current) => ({
                              ...current,
                              powExperienceCheck: checked,
                            }))
                        : undefined
                    }
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, [entry.key]: value }))
                    }
                    value={draft[entry.key]}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-panel-border/40 pt-2">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold">Passions</h4>
            </div>
            <div className="mt-1.5">
              {character.passions.length > 0 ? (
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {character.passions
                    .slice()
                    .sort((lhs, rhs) => rhs.percentage - lhs.percentage)
                    .slice(0, 6)
                    .map((passion) => (
                      <div
                        key={`${passion.name}-${passion.percentage}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-stone-700 dark:text-stone-200">
                          {passion.name}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {passion.percentage}%
                        </span>
                        <input
                          aria-label={`${passion.name} experience check`}
                          checked={Boolean(passion.experienceCheck)}
                          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                          onChange={(event) => {
                            void onSaveCharacter({
                              ...character,
                              passions: character.passions.map((entry) =>
                                entry.name === passion.name &&
                                entry.percentage === passion.percentage
                                  ? {
                                      ...entry,
                                      experienceCheck: event.target.checked,
                                    }
                                  : entry,
                              ),
                            });
                          }}
                          type="checkbox"
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-stone-500">No passions yet.</div>
              )}
            </div>
          </div>
          {previewCharacter ? (
            <SkillsList
              character={previewCharacter}
              onSaveCharacter={onSaveCharacter}
              searchText={skillSearch}
              onSearchTextChange={setSkillSearch}
            />
          ) : null}
        </div>
      ) : (
        <EmptyCardMessage text="Select or create a character to see the workspace." />
      )}
    </DashboardCard>
  );
}

function SkillsList({
  character,
  onSaveCharacter,
  searchText,
  onSearchTextChange,
}: {
  character: Character;
  onSaveCharacter: (character: Character) => Promise<void>;
  searchText: string;
  onSearchTextChange: (value: string) => void;
}) {
  const [skillDrafts, setSkillDrafts] = useState<Record<string, { value?: string; experienceCheck?: boolean }>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(getSkillGroupOrder().map((group) => [group, false])),
  );
  const lastSavedSkillsRef = useRef("");
  const leftColumnGroups = useMemo(
    () => ["agility", "manipulation", "perception", "communication"] as const,
    [],
  );
  const leftColumnGroupSet = useMemo(
    () => new Set<string>(leftColumnGroups),
    [leftColumnGroups],
  );
  const rightColumnGroups = useMemo(
    () =>
      getSkillGroupOrder().filter((group) => leftColumnGroupSet.has(group) === false),
    [leftColumnGroupSet],
  );

  async function handleAddSkill(group: ReturnType<typeof getSkillGroupOrder>[number]) {
    const nextSkill: CharacterSkillRecord = {
      name: "New Skill",
      group,
      baseRule: "0",
      modifier: 0,
      isCustom: true,
      experienceCheck: false,
    };

    await onSaveCharacter({
      ...character,
      skills: [...character.skills, nextSkill],
    });
  }

  async function handleDeleteSkill(targetSkill: CharacterSkillRecord) {
    await onSaveCharacter({
      ...character,
      skills: character.skills.filter(
        (skill) =>
          skill.group !== targetSkill.group || skill.name !== targetSkill.name,
      ),
    });
    setSkillDrafts((current) => {
      const next = { ...current };
      delete next[skillKey(targetSkill)];
      return next;
    });
  }

  useEffect(() => {
    const nextSkills = character.skills.map((skill) => {
      const draft = skillDrafts[skillKey(skill)];
      const nextValue = parseNumberDraft(
        draft?.value ?? "",
        getSkillEffectiveValue(character, skill),
      );

      return {
        ...skill,
        modifier:
          nextValue -
          (getSkillEffectiveValue(character, skill) - skill.modifier),
        experienceCheck: draft?.experienceCheck ?? skill.experienceCheck,
      };
    });
    const saveKey = JSON.stringify(
      nextSkills.map((skill) => [skill.name, skill.group, skill.modifier, skill.experienceCheck]),
    );
    const currentKey = JSON.stringify(
      character.skills.map((skill) => [skill.name, skill.group, skill.modifier, skill.experienceCheck]),
    );

    if (saveKey === currentKey || saveKey === lastSavedSkillsRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedSkillsRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        skills: nextSkills,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, onSaveCharacter, skillDrafts]);

  const groupedSkills = getGroupedSkills(
    {
      ...character,
      skills: character.skills.map((skill) => {
        const draft = skillDrafts[skillKey(skill)];
        const nextValue = parseNumberDraft(
          draft?.value ?? "",
          getSkillEffectiveValue(character, skill),
        );

        return {
          ...skill,
          modifier:
            nextValue -
            (getSkillEffectiveValue(character, skill) - skill.modifier),
          experienceCheck: draft?.experienceCheck ?? skill.experienceCheck,
        };
      }),
    },
    searchText,
  );

  return (
    <section className="pt-2">
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        Skills
      </h4>
      <div className="mb-2">
        <input
          className="min-h-9 w-full rounded-[8px] bg-black/[0.035] px-3 py-1.5 text-sm outline-none placeholder:text-stone-400 dark:bg-white/[0.04]"
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Search skills"
          value={searchText}
        />
      </div>
      <div className="grid gap-x-6 gap-y-3 lg:grid-cols-2">
        <div className="space-y-3">
          {leftColumnGroups.map((group) => {
            const skills = groupedSkills[group];
            const hasQuery = searchText.trim().length > 0;

            if (hasQuery && skills.length === 0) {
              return null;
            }

            return (
              <SkillGroupSection
                key={group}
                character={character}
                collapsed={collapsedGroups[group]}
                group={group}
                onToggle={() =>
                  setCollapsedGroups((current) => ({
                    ...current,
                    [group]: !current[group],
                  }))
                }
                skillDrafts={skillDrafts}
                skills={skills}
                onAddSkill={() => void handleAddSkill(group)}
                onDeleteSkill={(skill) => void handleDeleteSkill(skill)}
                onUpdateSkillDraft={(skill, value, experienceCheck) =>
                  setSkillDrafts((current) => ({
                    ...current,
                    [skillKey(skill)]: {
                      value,
                      experienceCheck,
                    },
                  }))
                }
              />
            );
          })}
        </div>
        <div className="space-y-3">
          {rightColumnGroups.map((group) => {
            const skills = groupedSkills[group];
            const hasQuery = searchText.trim().length > 0;

            if (hasQuery && skills.length === 0) {
              return null;
            }

            return (
              <SkillGroupSection
                key={group}
                character={character}
                collapsed={collapsedGroups[group]}
                group={group}
                onToggle={() =>
                  setCollapsedGroups((current) => ({
                    ...current,
                    [group]: !current[group],
                  }))
                }
                skillDrafts={skillDrafts}
                skills={skills}
                onAddSkill={() => void handleAddSkill(group)}
                onDeleteSkill={(skill) => void handleDeleteSkill(skill)}
                onUpdateSkillDraft={(skill, value, experienceCheck) =>
                  setSkillDrafts((current) => ({
                    ...current,
                    [skillKey(skill)]: {
                      value,
                      experienceCheck,
                    },
                  }))
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkillGroupSection({
  character,
  collapsed,
  group,
  onToggle,
  onAddSkill,
  onDeleteSkill,
  onUpdateSkillDraft,
  skillDrafts,
  skills,
}: {
  character: Character;
  collapsed: boolean;
  group: ReturnType<typeof getSkillGroupOrder>[number];
  onToggle: () => void;
  onAddSkill: () => void;
  onDeleteSkill: (skill: CharacterSkillRecord) => void;
  onUpdateSkillDraft: (
    skill: CharacterSkillRecord,
    value: string,
    experienceCheck: boolean,
  ) => void;
  skillDrafts: Record<string, { value?: string; experienceCheck?: boolean }>;
  skills: CharacterSkillRecord[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b border-panel-border/60 pb-1">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggle}
          type="button"
        >
          <span className="text-xs text-stone-500">{collapsed ? ">" : "v"}</span>
          <h4 className="text-sm font-semibold">{getSkillGroupTitle(group)}</h4>
        </button>
        <span className="shrink-0 text-sm text-stone-500 tabular-nums">
          {formatSignedPercentage(getSkillGroupBonus(character, group))}
        </span>
      </div>
      {collapsed ? null : (
        <div className="mt-1.5">
          <div className="grid grid-cols-[minmax(0,1fr)_52px_36px_22px_20px] items-center gap-2 border-b border-panel-border/40 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            <span>Skill</span>
            <span className="text-right">%</span>
            <span className="text-left">S/L</span>
            <span className="text-center">XP</span>
            <span />
          </div>
          {skills.length > 0 ? (
            <div className="divide-y divide-panel-border/30">
              {skills.map((skill) => (
                <div
                  key={`${group}-${skill.name}`}
                  className="grid grid-cols-[minmax(0,1fr)_52px_36px_22px_20px] items-center gap-2 py-1 text-sm"
                >
                  <span
                    className="min-w-0 truncate text-stone-700 dark:text-stone-200"
                    title={skill.name}
                  >
                    {skill.name}
                  </span>
                  <input
                    className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right font-semibold tabular-nums outline-none dark:bg-white/[0.035]"
                    inputMode="numeric"
                    onChange={(event) =>
                      onUpdateSkillDraft(
                        skill,
                        event.target.value,
                        skillDrafts[skillKey(skill)]?.experienceCheck ??
                          skill.experienceCheck,
                      )
                    }
                    value={
                      skillDrafts[skillKey(skill)]?.value ??
                      String(getSkillEffectiveValue(character, skill))
                    }
                  />
                  <DerivedChanceStack
                    value={parseNumberDraft(
                      skillDrafts[skillKey(skill)]?.value ??
                        String(getSkillEffectiveValue(character, skill)),
                      getSkillEffectiveValue(character, skill),
                    )}
                  />
                  <div className="flex justify-center">
                    <input
                      checked={Boolean(
                        skillDrafts[skillKey(skill)]?.experienceCheck ??
                          skill.experienceCheck,
                      )}
                      className="h-3.5 w-3.5 rounded border-panel-border"
                      onChange={(event) =>
                        onUpdateSkillDraft(
                          skill,
                          skillDrafts[skillKey(skill)]?.value ??
                            String(getSkillEffectiveValue(character, skill)),
                          event.target.checked,
                        )
                      }
                      type="checkbox"
                    />
                  </div>
                  <button
                    aria-label={`Delete ${skill.name}`}
                    className="text-center text-xs text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-200"
                    onClick={() => onDeleteSkill(skill)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-0.5 text-sm text-stone-500">No matches</div>
          )}
          <div className="pt-1.5">
            <button
              className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-foreground"
              onClick={onAddSkill}
              type="button"
            >
              + Add Skill
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function skillKey(skill: CharacterSkillRecord): string {
  return `${skill.group}::${skill.name}`;
}

function formatSignedPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function CombatCard({
  character,
  onSaveCharacter,
}: {
  character: Character | null;
  onSaveCharacter: (character: Character) => Promise<void>;
}) {
  const [hitLocationDraft, setHitLocationDraft] = useState<
    Record<string, { armour: string; currentHP: string }>
  >(() =>
    Object.fromEntries(
      (character?.hitLocations ?? []).map((location) => [
        location.key,
        {
          armour: String(location.armour),
          currentHP: String(location.currentHP),
        },
      ]),
    ),
  );
  const lastSavedHitLocationsRef = useRef("");
  const lastSavedNotesRef = useRef("");
  const lastSavedEquipmentRef = useRef("");
  const lastSavedWeaponsRef = useRef("");
  const [notesDraft, setNotesDraft] = useState(character?.notes ?? "");
  const [equipmentDrafts, setEquipmentDrafts] = useState<
    Record<string, Partial<CharacterEquipmentRecord>>
  >({});
  const [weaponDrafts, setWeaponDrafts] = useState<
    Record<string, Partial<CharacterWeaponRecord>>
  >({});
  const [expandedWeaponKeys, setExpandedWeaponKeys] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextHitLocations = character.hitLocations.map((location) => {
      const draft = hitLocationDraft[location.key];
      return {
        ...location,
        armour: parseNumberDraft(draft?.armour ?? "", location.armour),
        currentHP: parseNumberDraft(draft?.currentHP ?? "", location.currentHP),
      };
    });
    const saveKey = JSON.stringify(
      nextHitLocations.map((location) => [
        location.key,
        location.armour,
        location.currentHP,
      ]),
    );
    const currentKey = JSON.stringify(
      character.hitLocations.map((location) => [
        location.key,
        location.armour,
        location.currentHP,
      ]),
    );

    if (saveKey === currentKey || saveKey === lastSavedHitLocationsRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedHitLocationsRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        hitLocations: nextHitLocations,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, hitLocationDraft, onSaveCharacter]);

  useEffect(() => {
    if (!character) {
      return;
    }

    if (notesDraft === character.notes || notesDraft === lastSavedNotesRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedNotesRef.current = notesDraft;
      void onSaveCharacter({
        ...character,
        notes: notesDraft,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [character, notesDraft, onSaveCharacter]);

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextEquipment = character.equipment.map((item, index) => ({
      ...item,
      ...equipmentDrafts[equipmentKey(item, index)],
    }));
    const saveKey = JSON.stringify(
      nextEquipment.map((item) => [item.name, item.enc, item.isEquipped]),
    );
    const currentKey = JSON.stringify(
      character.equipment.map((item) => [item.name, item.enc, item.isEquipped]),
    );

    if (saveKey === currentKey || saveKey === lastSavedEquipmentRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedEquipmentRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        equipment: nextEquipment,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, equipmentDrafts, onSaveCharacter]);

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextWeapons = character.weapons.map((weapon, index) => ({
      ...weapon,
      ...weaponDrafts[weaponKey(weapon, index)],
    }));
    const saveKey = JSON.stringify(
      nextWeapons.map((weapon) => [
        weapon.name,
        weapon.percentage,
        weapon.experienceCheck,
        weapon.strikeRank,
        weapon.damage,
        weapon.hpCurrent ?? null,
        weapon.hpMax ?? null,
        weapon.enc ?? null,
        weapon.type,
        weapon.isEquipped,
        weapon.range,
      ]),
    );
    const currentKey = JSON.stringify(
      character.weapons.map((weapon) => [
        weapon.name,
        weapon.percentage,
        weapon.experienceCheck,
        weapon.strikeRank,
        weapon.damage,
        weapon.hpCurrent ?? null,
        weapon.hpMax ?? null,
        weapon.enc ?? null,
        weapon.type,
        weapon.isEquipped,
        weapon.range,
      ]),
    );

    if (saveKey === currentKey || saveKey === lastSavedWeaponsRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedWeaponsRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        weapons: nextWeapons,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, onSaveCharacter, weaponDrafts]);

  const featuredStrikeRank = character
    ? (character.weapons.find((weapon) => weapon.isEquipped)?.strikeRank ||
        character.weapons[0]?.strikeRank ||
        "-")
    : "-";

  return (
    <DashboardCard>
      {character ? (
        <div className="space-y-2.5">
          <div className="pt-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Hit Locations
              </h4>
            </div>
            <div className="mt-1">
              <HitLocationBodyLayout
                draft={hitLocationDraft}
                character={character}
                onArmourChange={(key, value) =>
                  setHitLocationDraft((current) => ({
                    ...current,
                    [key]: {
                      ...(current[key] ?? { armour: "0", currentHP: "0" }),
                      armour: value,
                    },
                  }))
                }
                onCurrentHPChange={(key, value) =>
                  setHitLocationDraft((current) => ({
                    ...current,
                    [key]: {
                      ...(current[key] ?? { armour: "0", currentHP: "0" }),
                      currentHP: value,
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-panel-border/40 pt-2 text-sm">
            <CompactMetric label="Strike Rank" value={featuredStrikeRank} />
            <CompactMetric label="Damage Bonus" value={getDamageBonusText(character)} />
          </div>
          <WeaponsList
            character={character}
            expandedWeaponKeys={expandedWeaponKeys}
            onSaveCharacter={onSaveCharacter}
            onToggleExpanded={(key) =>
              setExpandedWeaponKeys((current) => ({
                ...current,
                [key]: !current[key],
              }))
            }
            onUpdateWeaponDraft={(key, patch) =>
              setWeaponDrafts((current) => ({
                ...current,
                [key]: {
                  ...current[key],
                  ...patch,
                },
              }))
            }
            weaponDrafts={weaponDrafts}
            weapons={character.weapons}
          />
          <EquipmentList
            character={character}
            equipmentDrafts={equipmentDrafts}
            onSaveCharacter={onSaveCharacter}
            onUpdateEquipmentDraft={(key, patch) =>
              setEquipmentDrafts((current) => ({
                ...current,
                [key]: {
                  ...current[key],
                  ...patch,
                },
              }))
            }
          />
          <div className="pt-1">
            <h4 className="text-sm font-semibold">Notes</h4>
            <textarea
              className="mt-2 min-h-24 w-full rounded-[8px] bg-black/[0.035] px-3 py-2 text-sm leading-5 outline-none dark:bg-white/[0.04]"
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Add notes for this character..."
              value={notesDraft}
            />
          </div>
        </div>
      ) : (
        <EmptyCardMessage text="Combat details appear once a character is selected." />
      )}
    </DashboardCard>
  );
}

function EquipmentList({
  character,
  equipmentDrafts,
  onSaveCharacter,
  onUpdateEquipmentDraft,
}: {
  character: Character;
  equipmentDrafts: Record<string, Partial<CharacterEquipmentRecord>>;
  onSaveCharacter: (character: Character) => Promise<void>;
  onUpdateEquipmentDraft: (key: string, patch: Partial<CharacterEquipmentRecord>) => void;
}) {
  return (
    <section className="border-t border-panel-border/40 pt-2">
      <div className="mb-1 grid grid-cols-[minmax(0,1fr)_42px_26px_20px] items-center gap-2 border-b border-panel-border/30 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
        <span>Equipment</span>
        <span className="text-right">ENC</span>
        <span className="text-center">Eq</span>
        <span />
      </div>
      <div className="space-y-1.5">
        {character.equipment.map((item, index) => {
          const key = equipmentKey(item, index);
          const draft = equipmentDrafts[key];
          const merged = { ...item, ...draft };

          return (
            <div
              key={key}
              className="grid grid-cols-[minmax(0,1fr)_42px_26px_20px] items-center gap-2 text-sm"
            >
              <input
                className="min-h-6 rounded-[4px] bg-black/[0.025] px-1.5 py-0 outline-none dark:bg-white/[0.035]"
                onChange={(event) =>
                  onUpdateEquipmentDraft(key, { name: event.target.value })
                }
                value={merged.name ?? ""}
              />
              <input
                className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right tabular-nums outline-none dark:bg-white/[0.035]"
                inputMode="numeric"
                onChange={(event) =>
                  onUpdateEquipmentDraft(key, {
                    enc: parseNumberDraft(event.target.value, merged.enc ?? 0),
                  })
                }
                value={String(merged.enc ?? 0)}
              />
              <div className="flex justify-center">
                <input
                  checked={Boolean(merged.isEquipped)}
                  className="h-3.5 w-3.5 rounded border-panel-border"
                  onChange={(event) =>
                    onUpdateEquipmentDraft(key, { isEquipped: event.target.checked })
                  }
                  type="checkbox"
                />
              </div>
              <button
                aria-label={`Delete ${merged.name || "equipment"}`}
                className="text-center text-xs text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-200"
                onClick={() =>
                  void onSaveCharacter({
                    ...character,
                    equipment: character.equipment.filter((_, currentIndex) => currentIndex !== index),
                  })
                }
                type="button"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <div className="pt-1.5">
        <button
          className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-foreground"
          onClick={() =>
            void onSaveCharacter({
              ...character,
              equipment: [
                ...character.equipment,
                { name: "New Item", enc: 0, isEquipped: false },
              ],
            })
          }
          type="button"
        >
          + Add Equipment
        </button>
      </div>
    </section>
  );
}

function WeaponsList({
  character,
  expandedWeaponKeys,
  onSaveCharacter,
  onToggleExpanded,
  onUpdateWeaponDraft,
  weaponDrafts,
  weapons,
}: {
  character: Character;
  expandedWeaponKeys: Record<string, boolean>;
  onSaveCharacter: (character: Character) => Promise<void>;
  onToggleExpanded: (key: string) => void;
  onUpdateWeaponDraft: (key: string, patch: Partial<CharacterWeaponRecord>) => void;
  weaponDrafts: Record<string, Partial<CharacterWeaponRecord>>;
  weapons: CharacterWeaponRecord[];
}) {
  if (weapons.length === 0) {
    return (
      <section className="border-t border-panel-border/40 pt-2">
        <div className="text-sm text-stone-500">No weapons yet.</div>
        <div className="pt-1.5">
          <button
            className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-foreground"
            onClick={() =>
              void onSaveCharacter({
                ...character,
                weapons: [
                  ...character.weapons,
                  {
                    name: "New Weapon",
                    percentage: 0,
                    experienceCheck: false,
                    damage: "",
                    strikeRank: "",
                    range: "",
                    type: "",
                    isEquipped: false,
                  },
                ],
              })
            }
            type="button"
          >
            + Add Weapon
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-panel-border/40 pt-2">
      <div className="mb-1 grid grid-cols-[18px_minmax(0,1fr)_44px_36px_22px_48px_56px] items-center gap-2 border-b border-panel-border/30 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
        <span />
        <span>Weapon</span>
        <span className="text-right">%</span>
        <span className="text-left">S/L</span>
        <span className="text-center">XP</span>
        <span className="text-center">SR</span>
        <span className="text-right">Dmg</span>
      </div>
      <div className="space-y-1.5">
        {weapons.map((weapon, index) => {
          const key = weaponKey(weapon, index);
          const draft = weaponDrafts[key];

          return (
            <WeaponListRow
              key={key}
              isExpanded={expandedWeaponKeys[key] ?? false}
              onDelete={() =>
                void onSaveCharacter({
                  ...character,
                  weapons: character.weapons.filter((_, currentIndex) => currentIndex !== index),
                })
              }
              onToggleExpanded={() => onToggleExpanded(key)}
              onUpdate={(patch) => onUpdateWeaponDraft(key, patch)}
              weapon={{ ...weapon, ...draft }}
            />
          );
        })}
      </div>
      <div className="pt-1.5">
        <button
          className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-foreground"
          onClick={() =>
            void onSaveCharacter({
              ...character,
              weapons: [
                ...character.weapons,
                {
                  name: "New Weapon",
                  percentage: 0,
                  experienceCheck: false,
                  damage: "",
                  strikeRank: "",
                  range: "",
                  type: "",
                  isEquipped: false,
                },
              ],
            })
          }
          type="button"
        >
          + Add Weapon
        </button>
      </div>
    </section>
  );
}

function WeaponListRow({
  isExpanded,
  onDelete,
  onToggleExpanded,
  onUpdate,
  weapon,
}: {
  isExpanded: boolean;
  onDelete: () => void;
  onToggleExpanded: () => void;
  onUpdate: (patch: Partial<CharacterWeaponRecord>) => void;
  weapon: CharacterWeaponRecord;
}) {
  return (
    <div className="border-b border-panel-border/30 pb-1.5 last:border-b-0">
      <div className="grid grid-cols-[18px_minmax(0,1fr)_44px_36px_22px_48px_56px] items-center gap-2 text-sm">
        <button
          aria-label={isExpanded ? "Collapse weapon" : "Expand weapon"}
          className="text-xs text-stone-500"
          onClick={onToggleExpanded}
          type="button"
        >
          {isExpanded ? "v" : ">"}
        </button>
        <div className="min-w-0">
          <div className="truncate font-medium">{weapon.name || "Weapon"}</div>
          {weapon.type ? (
            <div className="truncate text-[11px] text-stone-500">
              {getWeaponTypeLabel(weapon.type)}
            </div>
          ) : null}
        </div>
        <input
          className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right font-semibold tabular-nums outline-none dark:bg-white/[0.035]"
          inputMode="numeric"
          onChange={(event) =>
            onUpdate({ percentage: parseNumberDraft(event.target.value, weapon.percentage) })
          }
          value={String(weapon.percentage ?? 0)}
        />
        <DerivedChanceStack value={weapon.percentage ?? 0} />
        <div className="flex justify-center">
          <input
            checked={Boolean(weapon.experienceCheck)}
            className="h-3.5 w-3.5 rounded border-panel-border"
            onChange={(event) => onUpdate({ experienceCheck: event.target.checked })}
            type="checkbox"
          />
        </div>
        <input
          className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-center font-semibold tabular-nums outline-none dark:bg-white/[0.035]"
          onChange={(event) => onUpdate({ strikeRank: event.target.value })}
          value={weapon.strikeRank ?? ""}
        />
        <input
          className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right outline-none dark:bg-white/[0.035]"
          onChange={(event) => onUpdate({ damage: event.target.value })}
          value={weapon.damage ?? ""}
        />
      </div>
      {isExpanded ? (
        <div className="grid gap-2 pl-6 pt-2 text-sm sm:grid-cols-2">
          <div className="grid grid-cols-[auto_38px_12px_38px] items-center gap-1">
            <span className="text-stone-500">Hit points</span>
            <input
              className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-center tabular-nums outline-none dark:bg-white/[0.035]"
              inputMode="numeric"
              onChange={(event) =>
                onUpdate({
                  hpCurrent: parseOptionalNumberDraft(event.target.value, weapon.hpCurrent),
                })
              }
              value={formatOptionalNumber(weapon.hpCurrent)}
            />
            <span className="text-center text-stone-400">/</span>
            <input
              className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-center tabular-nums outline-none dark:bg-white/[0.035]"
              inputMode="numeric"
              onChange={(event) =>
                onUpdate({
                  hpMax: parseOptionalNumberDraft(event.target.value, weapon.hpMax),
                })
              }
              value={formatOptionalNumber(weapon.hpMax)}
            />
          </div>
          <div className="grid grid-cols-[auto_38px_auto_96px] items-center gap-2">
            <span className="text-stone-500">ENC</span>
            <input
              className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-center tabular-nums outline-none dark:bg-white/[0.035]"
              inputMode="numeric"
              onChange={(event) =>
                onUpdate({
                  enc: parseOptionalNumberDraft(event.target.value, weapon.enc),
                })
              }
              value={formatOptionalNumber(weapon.enc)}
            />
            <span className="text-stone-500">type</span>
            <select
              className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 outline-none dark:bg-white/[0.035]"
              onChange={(event) =>
                onUpdate({ type: event.target.value as CharacterWeaponRecord["type"] })
              }
              value={weapon.type ?? ""}
            >
              <option value="">{getWeaponTypeLabel("")}</option>
              <option value="c">{getWeaponTypeLabel("c")}</option>
              <option value="s">{getWeaponTypeLabel("s")}</option>
              <option value="i">{getWeaponTypeLabel("i")}</option>
              <option value="cnt">{getWeaponTypeLabel("cnt")}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Equipped</span>
            <input
              checked={Boolean(weapon.isEquipped)}
              className="h-3.5 w-3.5 rounded border-panel-border"
              onChange={(event) => onUpdate({ isEquipped: event.target.checked })}
              type="checkbox"
            />
          </label>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <span className="text-stone-500">Range:</span>
            <input
              className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 outline-none dark:bg-white/[0.035]"
              onChange={(event) => onUpdate({ range: event.target.value })}
              value={weapon.range ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-red-700 dark:hover:text-red-300"
              onClick={onDelete}
              type="button"
            >
              Delete Weapon
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HitLocationBodyLayout({
  character,
  draft,
  onArmourChange,
  onCurrentHPChange,
}: {
  character: Character;
  draft: Record<string, { armour: string; currentHP: string }>;
  onArmourChange: (key: string, value: string) => void;
  onCurrentHPChange: (key: string, value: string) => void;
}) {
  const byKey = Object.fromEntries(
    character.hitLocations.map((location) => [location.key, location]),
  );

  return (
    <div className="relative mx-auto aspect-[0.76] w-full max-w-[332px]">
      <div className="absolute inset-[5%_16%_4%_16%] flex items-center justify-center">
        <Image
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain opacity-20 grayscale dark:opacity-16"
          draggable="false"
          fill
          src="/rune-man.png"
        />
      </div>

      <HitLocationBadge
        className="left-1/2 top-[8%] -translate-x-1/2"
        currentHPValue={draft.head?.currentHP ?? String(byKey.head?.currentHP ?? 0)}
        armourValue={draft.head?.armour ?? String(byKey.head?.armour ?? 0)}
        location={byKey.head}
        onArmourChange={(value) => onArmourChange("head", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("head", value)}
      />
      <HitLocationBadge
        className="left-1/2 top-[34%] -translate-x-1/2"
        currentHPValue={draft.chest?.currentHP ?? String(byKey.chest?.currentHP ?? 0)}
        armourValue={draft.chest?.armour ?? String(byKey.chest?.armour ?? 0)}
        location={byKey.chest}
        onArmourChange={(value) => onArmourChange("chest", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("chest", value)}
      />
      <HitLocationBadge
        className="left-1/2 top-[55%] -translate-x-1/2"
        currentHPValue={
          draft.abdomen?.currentHP ?? String(byKey.abdomen?.currentHP ?? 0)
        }
        armourValue={draft.abdomen?.armour ?? String(byKey.abdomen?.armour ?? 0)}
        location={byKey.abdomen}
        onArmourChange={(value) => onArmourChange("abdomen", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("abdomen", value)}
      />
      <HitLocationBadge
        className="left-[2%] top-[34%]"
        currentHPValue={
          draft.rightArm?.currentHP ?? String(byKey.rightArm?.currentHP ?? 0)
        }
        armourValue={draft.rightArm?.armour ?? String(byKey.rightArm?.armour ?? 0)}
        location={byKey.rightArm}
        onArmourChange={(value) => onArmourChange("rightArm", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("rightArm", value)}
      />
      <HitLocationBadge
        className="right-[2%] top-[34%]"
        currentHPValue={
          draft.leftArm?.currentHP ?? String(byKey.leftArm?.currentHP ?? 0)
        }
        armourValue={draft.leftArm?.armour ?? String(byKey.leftArm?.armour ?? 0)}
        location={byKey.leftArm}
        onArmourChange={(value) => onArmourChange("leftArm", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("leftArm", value)}
      />
      <HitLocationBadge
        className="left-[8%] top-[71%]"
        currentHPValue={
          draft.rightLeg?.currentHP ?? String(byKey.rightLeg?.currentHP ?? 0)
        }
        armourValue={draft.rightLeg?.armour ?? String(byKey.rightLeg?.armour ?? 0)}
        location={byKey.rightLeg}
        onArmourChange={(value) => onArmourChange("rightLeg", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("rightLeg", value)}
      />
      <HitLocationBadge
        className="right-[8%] top-[71%]"
        currentHPValue={
          draft.leftLeg?.currentHP ?? String(byKey.leftLeg?.currentHP ?? 0)
        }
        armourValue={draft.leftLeg?.armour ?? String(byKey.leftLeg?.armour ?? 0)}
        location={byKey.leftLeg}
        onArmourChange={(value) => onArmourChange("leftLeg", value)}
        onCurrentHPChange={(value) => onCurrentHPChange("leftLeg", value)}
      />
    </div>
  );
}

function HitLocationBadge({
  armourValue,
  className,
  currentHPValue,
  location,
  onArmourChange,
  onCurrentHPChange,
}: {
  armourValue: string;
  className: string;
  currentHPValue: string;
  location?: Character["hitLocations"][number];
  onArmourChange: (value: string) => void;
  onCurrentHPChange: (value: string) => void;
}) {
  if (!location) {
    return null;
  }

  return (
    <div
      className={`absolute w-[92px] rounded-[8px] bg-black/[0.045] px-1.5 py-1 text-center shadow-sm ${className} dark:bg-white/[0.06]`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-stone-500">
        {location.label}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-stone-500">
        {location.range}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-sm">
        <label className="rounded-[6px] bg-white/65 px-1 py-0.5 dark:bg-black/20">
          <div className="text-[9px] uppercase tracking-[0.08em] text-stone-500">
            AP
          </div>
          <input
            aria-label={`${location.label} armour`}
            className="mt-0.5 w-full bg-transparent text-center text-lg font-semibold leading-none tabular-nums outline-none"
            inputMode="numeric"
            onChange={(event) => onArmourChange(event.target.value)}
            value={armourValue}
          />
        </label>
        <label className="rounded-[6px] bg-white/65 px-1 py-0.5 dark:bg-black/20">
          <div className="text-[9px] uppercase tracking-[0.08em] text-stone-500">
            HP
          </div>
          <input
            aria-label={`${location.label} current hit points`}
            className="mt-0.5 w-full bg-transparent text-center text-lg font-semibold leading-none tabular-nums outline-none"
            inputMode="numeric"
            onChange={(event) => onCurrentHPChange(event.target.value)}
            value={currentHPValue}
          />
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-stone-500">
            / {location.maxHP}
          </div>
        </label>
      </div>
    </div>
  );
}

function RunesMagicCard({
  character,
  onSaveCharacter,
}: {
  character: Character | null;
  onSaveCharacter: (character: Character) => Promise<void>;
}) {
  const [runeDrafts, setRuneDrafts] = useState<Record<string, string>>({});
  const [runeCheckDrafts, setRuneCheckDrafts] = useState<Record<string, boolean>>({});
  const [magicSearch, setMagicSearch] = useState("");
  const [magicDrafts, setMagicDrafts] = useState<Record<string, { name?: string; points?: string; page?: string }>>({});
  const [magicStatsDraft, setMagicStatsDraft] = useState({
    currentMagicPoints: String(character?.currentMagicPoints ?? 0),
    runePoints: String(character?.runePoints ?? 3),
  });
  const lastSavedRunesRef = useRef("");
  const lastSavedMagicRef = useRef("");

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextRunePercentages = {
      ...character.runePercentages,
      ...Object.fromEntries(
        Object.entries(runeDrafts).map(([name, value]) => [
          name,
          parseNumberDraft(value, Number(character.runePercentages[name as keyof typeof character.runePercentages] ?? 0)),
        ]),
      ),
    };
    const nextRuneExperienceChecks = {
      ...character.runeExperienceChecks,
      ...runeCheckDrafts,
    };
    const saveKey = JSON.stringify({
      runePercentages: nextRunePercentages,
      runeExperienceChecks: nextRuneExperienceChecks,
    });
    const currentKey = JSON.stringify({
      runePercentages: character.runePercentages,
      runeExperienceChecks: character.runeExperienceChecks,
    });

    if (saveKey === currentKey || saveKey === lastSavedRunesRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedRunesRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        runePercentages: nextRunePercentages,
        runeExperienceChecks: nextRuneExperienceChecks,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, onSaveCharacter, runeCheckDrafts, runeDrafts]);

  useEffect(() => {
    if (!character) {
      return;
    }

    const nextMagic = character.magic.map((spell, index) => ({
      ...spell,
      name: magicDrafts[magicKey(spell, index)]?.name ?? spell.name,
      points: parseNumberDraft(
        magicDrafts[magicKey(spell, index)]?.points ?? "",
        spell.points,
      ),
      page: magicDrafts[magicKey(spell, index)]?.page ?? spell.page ?? "",
    }));
    const nextCurrentMagicPoints = parseNumberDraft(
      magicStatsDraft.currentMagicPoints,
      character.currentMagicPoints,
    );
    const nextRunePoints = parseNumberDraft(
      magicStatsDraft.runePoints,
      character.runePoints,
    );
    const saveKey = JSON.stringify({
      magic: nextMagic,
      currentMagicPoints: nextCurrentMagicPoints,
      runePoints: nextRunePoints,
    });
    const currentKey = JSON.stringify({
      magic: character.magic,
      currentMagicPoints: character.currentMagicPoints,
      runePoints: character.runePoints,
    });

    if (saveKey === currentKey || saveKey === lastSavedMagicRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastSavedMagicRef.current = saveKey;
      void onSaveCharacter({
        ...character,
        magic: nextMagic,
        currentMagicPoints: nextCurrentMagicPoints,
        runePoints: nextRunePoints,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [character, magicDrafts, magicStatsDraft, onSaveCharacter]);

  return (
    <DashboardCard>
      {character ? (
        <div className="space-y-2.5">
          <RunesAffinityPanel
            character={character}
            runeDrafts={runeDrafts}
            runeCheckDrafts={runeCheckDrafts}
            onChangeRune={(name, value) =>
              setRuneDrafts((current) =>
                updateRuneDrafts(current, name, value),
              )
            }
            onToggleRuneCheck={(name, checked) =>
              setRuneCheckDrafts((current) => ({
                ...current,
                [name]: checked,
              }))
            }
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <MagicSection
              character={character}
              magicDrafts={magicDrafts}
              magicSearch={magicSearch}
              magicStatsDraft={magicStatsDraft}
              onAddSpell={(kind) =>
                void onSaveCharacter({
                  ...character,
                  magic: [
                    ...character.magic,
                    {
                      name: "New Spell",
                      points: 1,
                      page: "",
                      source:
                        kind === "spirit"
                          ? "Spirit Magic"
                          : "Rune Magic",
                    },
                  ],
                })
              }
              onDeleteSpell={(index) =>
                void onSaveCharacter({
                  ...character,
                  magic: character.magic.filter((_, currentIndex) => currentIndex !== index),
                })
              }
              onSearchChange={setMagicSearch}
              onStatsChange={(field, value) =>
                setMagicStatsDraft((current) => ({
                  ...current,
                  [field]: value,
                }))
              }
              onUpdateSpellDraft={(key, patch) =>
                setMagicDrafts((current) => ({
                  ...current,
                  [key]: {
                    ...current[key],
                    ...patch,
                  },
                }))
              }
            />
          </div>
        </div>
      ) : (
        <EmptyCardMessage text="Secondary cards stay empty until a character is active." />
      )}
    </DashboardCard>
  );
}

const elementalRuneLayout = [
  { name: "fire", top: "3%", left: "50%", className: "-translate-x-1/2" },
  { name: "darkness", top: "24%", left: "84%", className: "-translate-x-1/2" },
  { name: "water", top: "66%", left: "74%", className: "-translate-x-1/2" },
  { name: "earth", top: "66%", left: "26%", className: "-translate-x-1/2" },
  { name: "air", top: "24%", left: "16%", className: "-translate-x-1/2" },
  { name: "moon", top: "36%", left: "50%", className: "-translate-x-1/2" },
] as const;

const pairedRuneRows = [
  ["fertility", "death"],
  ["harmony", "disorder"],
  ["truth", "illusion"],
  ["stasis", "movement"],
] as const;

function RunesAffinityPanel({
  character,
  runeDrafts,
  runeCheckDrafts,
  onChangeRune,
  onToggleRuneCheck,
}: {
  character: Character;
  runeDrafts: Record<string, string>;
  runeCheckDrafts: Record<string, boolean>;
  onChangeRune: (name: string, value: string) => void;
  onToggleRuneCheck: (name: string, checked: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        Runes
      </h4>
      <div className="relative mx-auto h-[272px] w-full max-w-[300px]">
        <div className="absolute inset-x-[18%] top-[16%] h-[48%] rounded-full border border-panel-border/40" />
        {elementalRuneLayout.map((rune) => (
          <div
            key={rune.name}
            className={`absolute ${rune.className}`}
            style={{ left: rune.left, top: rune.top }}
          >
            <RuneNode
              label={capitalize(rune.name)}
              name={rune.name}
              experienceChecked={
                runeCheckDrafts[rune.name] ??
                Boolean(
                  character.runeExperienceChecks[
                    rune.name as keyof typeof character.runeExperienceChecks
                  ],
                )
              }
              onToggleCheck={(checked) => onToggleRuneCheck(rune.name, checked)}
              value={runeDrafts[rune.name] ?? String(character.runePercentages[rune.name as keyof typeof character.runePercentages] ?? 0)}
              onChange={(value) => onChangeRune(rune.name, value)}
            />
          </div>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-[320px] py-1">
        <div className="absolute bottom-[12px] left-1/2 top-[12px] w-px -translate-x-1/2 bg-panel-border/60" />
        <div className="space-y-2">
          <div className="flex justify-center">
            <RuneNode
              label="Man"
              name="man"
              compact
              experienceChecked={
                runeCheckDrafts.man ?? Boolean(character.runeExperienceChecks.man)
              }
              onToggleCheck={(checked) => onToggleRuneCheck("man", checked)}
              value={runeDrafts.man ?? String(character.runePercentages.man ?? 50)}
              onChange={(value) => onChangeRune("man", value)}
            />
          </div>
          {pairedRuneRows.map(([left, right]) => (
            <div key={`${left}-${right}`} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="h-px bg-panel-border/60" />
              <div className="grid grid-cols-2 gap-[54px]">
                <RuneNode
                  label={capitalize(left)}
                  name={left}
                  compact
                  experienceChecked={
                    runeCheckDrafts[left] ??
                    Boolean(
                      character.runeExperienceChecks[
                        left as keyof typeof character.runeExperienceChecks
                      ],
                    )
                  }
                  onToggleCheck={(checked) => onToggleRuneCheck(left, checked)}
                  value={runeDrafts[left] ?? String(character.runePercentages[left as keyof typeof character.runePercentages] ?? 50)}
                  onChange={(value) => onChangeRune(left, value)}
                />
                <RuneNode
                  label={capitalize(right)}
                  name={right}
                  compact
                  experienceChecked={
                    runeCheckDrafts[right] ??
                    Boolean(
                      character.runeExperienceChecks[
                        right as keyof typeof character.runeExperienceChecks
                      ],
                    )
                  }
                  onToggleCheck={(checked) => onToggleRuneCheck(right, checked)}
                  value={runeDrafts[right] ?? String(character.runePercentages[right as keyof typeof character.runePercentages] ?? 50)}
                  onChange={(value) => onChangeRune(right, value)}
                />
              </div>
              <div className="h-px bg-panel-border/60" />
            </div>
          ))}
          <div className="flex justify-center">
            <RuneNode
              label="Beast"
              name="beast"
              compact
              experienceChecked={
                runeCheckDrafts.beast ?? Boolean(character.runeExperienceChecks.beast)
              }
              onToggleCheck={(checked) => onToggleRuneCheck("beast", checked)}
              value={runeDrafts.beast ?? String(character.runePercentages.beast ?? 50)}
              onChange={(value) => onChangeRune("beast", value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RuneNode({
  compact = false,
  experienceChecked,
  label,
  name,
  onChange,
  onToggleCheck,
  value,
}: {
  compact?: boolean;
  experienceChecked: boolean;
  label: string;
  name: string;
  onChange: (value: string) => void;
  onToggleCheck: (checked: boolean) => void;
  value: string;
}) {
  return (
    <label
      className={`block rounded-[8px] border border-panel-border/50 bg-black/[0.025] px-2 py-1 dark:bg-white/[0.03] ${
        compact ? "w-[108px]" : "w-[92px]"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
        <span className="truncate">{label}</span>
        <input
          checked={experienceChecked}
          className="h-3.5 w-3.5 rounded border-panel-border"
          onChange={(event) => onToggleCheck(event.target.checked)}
          type="checkbox"
        />
      </div>
      <div className="flex items-center gap-2">
        <Image
          alt=""
          aria-hidden="true"
          className="h-8 w-8 object-contain"
          draggable="false"
          height={32}
          src={`/rune-${name}.png`}
          width={32}
        />
        <input
          className="min-h-7 w-full bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
          inputMode="numeric"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
    </label>
  );
}

function updateRuneDrafts(
  current: Record<string, string>,
  name: string,
  value: string,
): Record<string, string> {
  const next = { ...current, [name]: value };
  const pairedRune = getPairedRune(name);
  if (!pairedRune) {
    return next;
  }

  const parsed = parseNumberDraft(value, 50);
  next[pairedRune] = String(Math.max(0, 100 - parsed));
  return next;
}

function getPairedRune(name: string): string | null {
  switch (name) {
    case "man":
      return "beast";
    case "beast":
      return "man";
    case "fertility":
      return "death";
    case "death":
      return "fertility";
    case "harmony":
      return "disorder";
    case "disorder":
      return "harmony";
    case "truth":
      return "illusion";
    case "illusion":
      return "truth";
    case "stasis":
      return "movement";
    case "movement":
      return "stasis";
    default:
      return null;
  }
}

const commonRuneSpellCatalog = [
  { name: "Command Cult Spirit", pointsText: "2", page: "323" },
  { name: "Dismiss Magic", pointsText: "1+", page: "326" },
  { name: "Divination", pointsText: "1+", page: "327" },
  { name: "Extension", pointsText: "1+", page: "328" },
  { name: "Find Enemy", pointsText: "1", page: "328" },
  { name: "Heal Wound", pointsText: "1", page: "330" },
  { name: "Multispell", pointsText: "1+", page: "335" },
  { name: "Sanctify", pointsText: "1+", page: "338" },
  { name: "Soul Sight", pointsText: "1", page: "340" },
  { name: "Spirit Block", pointsText: "1+", page: "341" },
  { name: "Summon Cult Spirit", pointsText: "1-3", page: "342" },
  { name: "Warding", pointsText: "1+", page: "347" },
] as const;

function MagicSection({
  character,
  magicDrafts,
  magicSearch,
  magicStatsDraft,
  onAddSpell,
  onDeleteSpell,
  onSearchChange,
  onStatsChange,
  onUpdateSpellDraft,
}: {
  character: Character;
  magicDrafts: Record<string, { name?: string; points?: string; page?: string }>;
  magicSearch: string;
  magicStatsDraft: { currentMagicPoints: string; runePoints: string };
  onAddSpell: (kind: "spirit" | "rune") => void;
  onDeleteSpell: (index: number) => void;
  onSearchChange: (value: string) => void;
  onStatsChange: (field: "currentMagicPoints" | "runePoints", value: string) => void;
  onUpdateSpellDraft: (key: string, patch: { name?: string; points?: string; page?: string }) => void;
}) {
  const spiritSpells = character.magic
    .map((spell, index) => ({ spell, index }))
    .filter(({ spell }) => classifySpellSource(spell.source) === "spirit")
    .filter(({ spell }) => spellMatchesSearch(spell.name, magicSearch));
  const runeSpells = character.magic
    .map((spell, index) => ({ spell, index }))
    .filter(({ spell }) => classifySpellSource(spell.source) === "rune")
    .filter(({ spell }) => spellMatchesSearch(spell.name, magicSearch));
  const commonRuneSpells = commonRuneSpellCatalog.filter((spell) =>
    spellMatchesSearch(spell.name, magicSearch),
  );

  return (
    <section className="space-y-2 border-t border-panel-border/40 pt-2">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        Magic
      </h4>
      <input
        className="min-h-8 w-full rounded-[8px] bg-black/[0.035] px-3 py-1.5 text-sm outline-none placeholder:text-stone-400 dark:bg-white/[0.04]"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search magic"
        value={magicSearch}
      />

      <MagicSpellGroup
        addLabel="+ Add Spirit Spell"
        emptyText={magicSearch.trim() ? "No spirit magic matches" : "No spirit magic yet"}
        spells={spiritSpells}
        title="Spirit Magic"
        trailing={
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">MP</span>
            <input
              className="min-h-6 w-10 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
              inputMode="numeric"
              onChange={(event) => onStatsChange("currentMagicPoints", event.target.value)}
              value={magicStatsDraft.currentMagicPoints}
            />
            <span className="text-sm text-stone-500">/ {getMaxMagicPoints(character)}</span>
          </div>
        }
        onAdd={() => onAddSpell("spirit")}
        onDelete={onDeleteSpell}
        onUpdateDraft={onUpdateSpellDraft}
        draftMap={magicDrafts}
      />

      <MagicSpellGroup
        addLabel="+ Add Rune Spell"
        emptyText={magicSearch.trim() ? "No rune spell matches" : "No rune spells yet"}
        spells={runeSpells}
        title="Rune Spells"
        trailing={
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">RP</span>
            <input
              className="min-h-6 w-10 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
              inputMode="numeric"
              onChange={(event) => onStatsChange("runePoints", event.target.value)}
              value={magicStatsDraft.runePoints}
            />
          </div>
        }
        onAdd={() => onAddSpell("rune")}
        onDelete={onDeleteSpell}
        onUpdateDraft={onUpdateSpellDraft}
        draftMap={magicDrafts}
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 border-b border-panel-border/40 pb-1">
          <h4 className="text-sm font-semibold">Common Rune Spells</h4>
        </div>
        {commonRuneSpells.length > 0 ? (
          <div className="space-y-1">
            {commonRuneSpells.map((spell) => (
              <div
                key={spell.name}
                className="grid grid-cols-[minmax(0,1fr)_36px_42px] gap-2 text-sm"
              >
                <span className="truncate">{spell.name}</span>
                <span className="text-right text-stone-500">{spell.pointsText}</span>
                <span className="text-right text-stone-500">p{spell.page}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-stone-500">No common rune spell matches</div>
        )}
      </div>
    </section>
  );
}

function MagicSpellGroup({
  addLabel,
  draftMap,
  emptyText,
  onAdd,
  onDelete,
  onUpdateDraft,
  spells,
  title,
  trailing,
}: {
  addLabel: string;
  draftMap: Record<string, { name?: string; points?: string; page?: string }>;
  emptyText: string;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onUpdateDraft: (key: string, patch: { name?: string; points?: string; page?: string }) => void;
  spells: Array<{ spell: Character["magic"][number]; index: number }>;
  title: string;
  trailing: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 border-b border-panel-border/40 pb-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        {trailing}
      </div>
      {spells.length > 0 ? (
        <div className="space-y-1">
          {spells.map(({ spell, index }) => {
            const key = magicKey(spell, index);
            return (
              <div
                key={key}
                className="grid grid-cols-[minmax(0,1fr)_38px_44px_20px] items-center gap-2 text-sm"
              >
                <input
                  className="min-h-6 rounded-[4px] bg-black/[0.025] px-1.5 py-0 outline-none dark:bg-white/[0.035]"
                  onChange={(event) => onUpdateDraft(key, { name: event.target.value })}
                  value={draftMap[key]?.name ?? spell.name}
                />
                <input
                  className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right tabular-nums outline-none dark:bg-white/[0.035]"
                  inputMode="numeric"
                  onChange={(event) => onUpdateDraft(key, { points: event.target.value })}
                  value={draftMap[key]?.points ?? String(spell.points)}
                />
                <input
                  className="min-h-6 rounded-[4px] bg-black/[0.025] px-1 py-0 text-right outline-none dark:bg-white/[0.035]"
                  onChange={(event) => onUpdateDraft(key, { page: event.target.value })}
                  placeholder="p."
                  value={draftMap[key]?.page ?? spell.page ?? ""}
                />
                <button
                  aria-label={`Delete ${spell.name}`}
                  className="text-center text-xs text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-200"
                  onClick={() => onDelete(index)}
                  type="button"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-stone-500">{emptyText}</div>
      )}
      <button
        className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 transition hover:text-foreground"
        onClick={onAdd}
        type="button"
      >
        {addLabel}
      </button>
    </div>
  );
}

function spellMatchesSearch(name: string, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  return trimmed.length === 0 || name.toLowerCase().includes(trimmed);
}

function magicKey(spell: Character["magic"][number], index: number): string {
  return `${index}:${spell.name.trim().toLowerCase()}`;
}

function capitalize(value: string): string {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function ImportCharacterModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rawText: string, nameOverride: string) => Promise<void>;
}) {
  const [rawText, setRawText] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedResult = parseTextImport(rawText);
  const review = reviewImportResult(parsedResult);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onImport(rawText, nameOverride);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-2xl rounded-[16px] border border-panel-border bg-panel p-4 shadow-xl backdrop-blur sm:p-4.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Import
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Import Character
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600 dark:text-stone-300">
              This is the first local import flow. Paste character text, review
              the guessed name, and save it as a new character.
            </p>
          </div>
          <button
                className="min-h-10 rounded-[10px] border border-panel-border px-3 py-2 text-sm font-medium"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Pasted character text</span>
            <textarea
              className="min-h-44 w-full rounded-[10px] border border-panel-border bg-transparent px-3 py-2.5 text-sm leading-5 outline-none"
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste the RuneQuest character text here..."
              value={rawText}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-[12px] border border-panel-border p-3">
              <p className="text-sm font-medium">Candidate name</p>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                {parsedResult.characterInfo.candidateName || "No name detected yet"}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Name override</span>
              <input
                className="min-h-10 w-full rounded-[10px] border border-panel-border bg-transparent px-3 py-2 text-sm outline-none"
                onChange={(event) => setNameOverride(event.target.value)}
                placeholder="Optional"
                value={nameOverride}
              />
            </label>
          </div>

          <div className="rounded-[12px] border border-panel-border p-3">
            <p className="text-sm font-medium">Import review</p>
            <div className="mt-2.5 grid gap-1.5">
              {review.map((item) => (
                <div
                  key={item.section}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-panel-border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        item.status === "green"
                          ? "bg-green-500"
                          : item.status === "yellow"
                            ? "bg-amber-500"
                            : "bg-red-500",
                      ].join(" ")}
                    />
                    <span className="text-sm font-medium">
                      {formatSectionLabel(item.section)}
                    </span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.12em] text-stone-500">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            className="min-h-10 rounded-[10px] border border-panel-border px-3 py-2 text-sm font-medium"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="min-h-10 rounded-[10px] bg-stone-900 px-3 py-2 text-sm font-medium text-stone-50 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950"
            disabled={rawText.trim().length === 0 || isSubmitting}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isSubmitting ? "Importing..." : "Save as New Character"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSectionLabel(section: string): string {
  switch (section) {
    case "characterInfo":
      return "Character info";
    case "attributes":
      return "Attributes";
    case "runes":
      return "Runes";
    case "skills":
      return "Skills";
    case "equipment":
      return "Equipment";
    case "magic":
      return "Magic";
    case "passions":
      return "Passions";
    default:
      return section;
  }
}

function DashboardCard({
  children,
}: {
  children: ReactNode;
}) {
  return <article className="min-w-0 px-1 py-1">{children}</article>;
}

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-panel-border/60 py-1 last:border-b-0">
      <span className="text-sm text-stone-600 dark:text-stone-300">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function HeaderSummaryField({
  field,
  label,
  onBlur,
  value,
}: {
  field: "worships" | "family" | "patron" | "occupation";
  label: string;
  onBlur: (
    field: "worships" | "family" | "patron" | "occupation",
    value: string,
  ) => Promise<void>;
  value: string;
}) {
  return (
    <label className="flex min-w-0 items-baseline gap-2">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}:
      </span>
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-stone-400"
        defaultValue={value}
        key={`${field}-${value}`}
        onBlur={(event) => void onBlur(field, event.target.value)}
        placeholder="—"
      />
    </label>
  );
}

function HeaderNameField({
  onBlur,
  value,
}: {
  onBlur: (
    field: "name" | "worships" | "family" | "patron" | "occupation",
    value: string,
  ) => Promise<void>;
  value: string;
}) {
  return (
    <input
      className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-stone-400"
      defaultValue={value}
      key={`name-${value}`}
      onBlur={(event) => void onBlur("name", event.target.value)}
      placeholder="Unnamed Character"
    />
  );
}

function StatisticStripCell({
  checkboxChecked,
  checkboxLabel,
  onCheckboxChange,
  label,
  onChange,
  value,
}: {
  checkboxChecked?: boolean;
  checkboxLabel?: string;
  onCheckboxChange?: (checked: boolean) => void;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block min-w-0 border-r border-b border-panel-border px-1 py-1.5 last:border-r-0 sm:border-b-0">
      <span className="flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-stone-500 sm:text-[9px]">
        <span>{label}</span>
        {onCheckboxChange ? (
          <span className="flex items-center gap-1 text-[8px] tracking-[0.1em] sm:text-[9px]">
            <input
              checked={checkboxChecked}
              className="h-3.5 w-3.5 rounded border-panel-border"
              onChange={(event) => onCheckboxChange(event.target.checked)}
              type="checkbox"
            />
            <span>{checkboxLabel}</span>
          </span>
        ) : null}
      </span>
      <input
        className="mt-1 min-h-7 w-full bg-transparent px-0.5 py-0.5 text-center text-sm font-semibold tabular-nums outline-none sm:text-[15px]"
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function EmptyCardMessage({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] bg-black/[0.03] p-2.5 text-sm leading-5 text-stone-600 dark:bg-white/[0.04] dark:text-stone-300">
      {text}
    </div>
  );
}

function DerivedChanceStack({ value }: { value: number }) {
  return (
    <div className="flex min-h-6 flex-col justify-center text-[10px] leading-3 text-stone-400">
      <span className="tabular-nums">S:{deriveSpecialChance(value)}</span>
      <span className="tabular-nums">L:{deriveCriticalChance(value)}</span>
    </div>
  );
}

function weaponKey(weapon: CharacterWeaponRecord, index: number): string {
  return `${index}:${weapon.name.trim().toLowerCase()}`;
}

function equipmentKey(item: CharacterEquipmentRecord, index: number): string {
  return `${index}:${item.name.trim().toLowerCase()}`;
}

function parseNumberDraft(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseOptionalNumberDraft(
  value: string,
  fallback: number | undefined,
): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "";
}

function deriveSpecialChance(value: number): number {
  return Math.floor(Math.max(0, value) / 5);
}

function deriveCriticalChance(value: number): number {
  return Math.floor(Math.max(0, value) / 20);
}

function sortCharacters(characters: Character[]): Character[] {
  return [...characters].sort((lhs, rhs) => {
    const nameCompare = lhs.name.localeCompare(rhs.name);
    return nameCompare !== 0 ? nameCompare : lhs.id.localeCompare(rhs.id);
  });
}
