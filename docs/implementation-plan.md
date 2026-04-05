# RQSheetWeb Implementation Plan

## Goals

- Get a local-only web app working as quickly as possible
- Make the UI touch-friendly from the start
- Support PWA install on iPad
- Preserve a clean upgrade path to a hosted version later

## Architecture rules

1. Keep RuneQuest rules and derived calculations in pure TypeScript modules under `src/domain/`.
2. Keep persistence behind a repository interface under `src/lib/storage/`.
3. Avoid coupling React components directly to IndexedDB details.
4. Treat the web app as a dashboard, not a literal screen-for-screen port of the iOS tab model.
5. Design for touch first even on large screens: no hover-only workflows and no required swipe gestures.

## Source structure

```txt
src/
  app/
    layout.tsx
    page.tsx
    characters/
      [characterId]/
        page.tsx
  components/
    app-shell/
      AppShell.tsx
      WorkspaceHeader.tsx
    sidebar/
      CharacterSidebar.tsx
      CharacterList.tsx
      CharacterListItem.tsx
      CharacterActions.tsx
    workspace/
      WorkspaceGrid.tsx
      SectionNav.tsx
    cards/
      IdentityCard.tsx
      CharacteristicsCard.tsx
      DerivedStatsCard.tsx
      HonorPassionsCard.tsx
      CombatCard.tsx
      WeaponsCard.tsx
      SkillsCard.tsx
      RunesCard.tsx
      MagicCard.tsx
      EquipmentCard.tsx
      NotesCard.tsx
    editors/
      CharacterDrawer.tsx
      WeaponDrawer.tsx
      SkillDrawer.tsx
      SpellDrawer.tsx
      EquipmentDrawer.tsx
    import/
      ImportCharacterModal.tsx
      ImportReview.tsx
    ui/
      Card.tsx
      IconButton.tsx
      SearchField.tsx
      NumberField.tsx
      ConfirmDialog.tsx
  domain/
    types.ts
    character.ts
    runes.ts
    skills.ts
    weapons.ts
    magic.ts
    equipment.ts
    import/
      types.ts
      normalize.ts
      section-detector.ts
      core-parser.ts
      skills-parser.ts
      equipment-magic-parser.ts
      pipeline.ts
      review.ts
  hooks/
    useSelectedCharacter.ts
    useWorkspaceLayout.ts
    useAutosave.ts
  lib/
    storage/
      types.ts
      indexeddb.ts
      character-repository.ts
      migrations.ts
    constants/
    utils/
  styles/
    globals.css
  tests/
    domain/
    storage/
    components/
    e2e/
```

## Data boundary

Define a repository interface first and code against it:

```ts
export interface CharacterRepository {
  listCharacters(): Promise<Character[]>
  getCharacter(id: string): Promise<Character | null>
  createCharacter(seed?: Partial<Character>): Promise<Character>
  saveCharacter(character: Character): Promise<void>
  deleteCharacter(id: string): Promise<void>
  importCharacter(result: ImportResult, nameOverride?: string): Promise<Character>
}
```

Initial implementation:

- `IndexedDbCharacterRepository`

Possible later implementation:

- `HostedCharacterRepository`

## UX structure

### App shell

- Persistent left sidebar for character selection and creation
- `Import Character` action in the sidebar
- Main area shows one selected character workspace
- Selected character id should live in the URL

### Workspace layout

Desktop, laptop, tablet landscape:

- sidebar + 3-column workspace
- column 1: identity, characteristics, derived stats, honor/passions
- column 2: combat, weapons, skills
- column 3: runes, magic, equipment, notes

Tablet portrait:

- collapsible sidebar
- 2-column workspace
- column 1: identity, characteristics, derived stats, runes, honor/passions
- column 2: combat, weapons, skills, magic, equipment, notes

Phone fallback:

- stacked single column

### Editing model

Inline:

- notes
- HP, MP, rune points
- simple stat values
- toggles such as equipped and experience checks
- rune percentages

Drawer:

- character details
- weapon editor
- skill editor
- spell editor
- equipment editor

Modal:

- import character
- destructive confirmations

## Milestones

### Milestone 1: Domain port

Deliverables:

- TypeScript domain types
- Derived rule helpers
- Unit tests ported from the existing Swift logic where practical

Acceptance criteria:

- damage bonus, MP limits, display name, rune summaries, encumbrance, and similar rules behave like the current app
- domain tests pass locally

### Milestone 2: Local persistence

Deliverables:

- IndexedDB schema
- repository implementation
- seed/create/update/delete flows for characters

Acceptance criteria:

- characters persist across refresh
- deleting a character removes related child records in the repository representation

### Milestone 3: App shell and routing

Deliverables:

- sidebar
- selected character route
- new character action
- empty state

Acceptance criteria:

- user can create, switch, and delete characters from the sidebar
- refreshing a character route restores that character from local storage

### Milestone 4: Workspace scaffold

Deliverables:

- responsive grid
- card containers
- workspace header

Acceptance criteria:

- 3-column layout works on desktop, laptop, and tablet landscape
- 2-column layout works on tablet portrait
- workspace remains usable without hover

### Milestone 5: Identity and derived stats

Deliverables:

- identity card
- characteristics card
- derived stats card
- honor/passions card

Acceptance criteria:

- editing these values updates derived calculations immediately
- touch interactions are comfortable on iPad

### Milestone 6: Combat and weapons

Deliverables:

- hit locations card
- weapons list
- weapon add/edit/delete

Acceptance criteria:

- add and edit weapon flows work via drawer
- no swipe-only actions are required

### Milestone 7: Skills

Deliverables:

- grouped skills card
- search
- add/edit/delete skills

Acceptance criteria:

- group bonuses display correctly
- search is fast and touch friendly

### Milestone 8: Runes and magic

Deliverables:

- rune editor
- spirit magic and rune spells
- MP and rune point controls

Acceptance criteria:

- rune and magic edits save locally and recalculate correctly

### Milestone 9: Equipment and notes

Deliverables:

- equipment card
- search
- encumbrance summary
- notes card

Acceptance criteria:

- equipment edits affect encumbrance immediately
- notes autosave cleanly

### Milestone 10: Import modal

Deliverables:

- paste/import modal
- parser pipeline port
- review UI
- save-as-new-character behavior

Acceptance criteria:

- importing creates a new character
- the app switches to the imported character after save
- import failures do not corrupt existing data

### Milestone 11: PWA and polish

Deliverables:

- manifest
- icons
- installability
- offline-capable local-first behavior
- final touch target and spacing pass

Acceptance criteria:

- app is installable on iPad
- app remains functional offline with locally stored data

## Ticket backlog

### Foundation

- Create Next.js app scaffold
- Add TypeScript, linting, formatting, and test setup
- Add PWA baseline configuration
- Define core domain types
- Port derived-character rules from Swift to TypeScript

### Persistence

- Define repository interface
- Implement IndexedDB storage
- Add migration versioning
- Add repository tests

### Shell

- Build sidebar character menu
- Add create/select/delete actions
- Add route-based selected character state
- Add workspace header

### Cards

- Build shared card primitives
- Implement identity card
- Implement characteristics card
- Implement derived stats card
- Implement honor/passions card
- Implement combat card
- Implement weapons card
- Implement skills card
- Implement runes card
- Implement magic card
- Implement equipment card
- Implement notes card

### Editing

- Build shared drawer framework
- Add character detail editor
- Add weapon editor
- Add skill editor
- Add spell editor
- Add equipment editor
- Add confirmation dialog

### Import

- Port text normalizer
- Port section detector
- Port core parser
- Port skills parser
- Port equipment and magic parser
- Build import review UI
- Save imported result as a new character

### Quality

- Add domain tests
- Add component tests for key cards
- Add Playwright flows for create/edit/import/delete
- Verify install and use on iPad PWA
