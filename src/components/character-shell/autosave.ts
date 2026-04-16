export async function persistAutosave(
  save: () => Promise<void>,
  markSaved: () => void,
): Promise<void> {
  await save();
  markSaved();
}
