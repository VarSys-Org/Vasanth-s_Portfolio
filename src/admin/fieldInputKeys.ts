export function handleWordListKey(
  event: Pick<KeyboardEvent, "key" | "isComposing" | "keyCode" | "preventDefault">,
  draft: string,
  add: (word: string) => void,
  removeLast: () => void,
): void {
  if (event.key === "Enter") {
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    add(draft);
  } else if (event.key === ",") {
    event.preventDefault();
    add(draft);
  } else if (event.key === "Backspace" && !draft) {
    removeLast();
  }
}
