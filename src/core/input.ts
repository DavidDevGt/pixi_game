/**
 * Estado de input "de juego": se consulta dentro de `simulate()`, nunca se
 * mueven entidades desde los listeners (rompería el timestep fijo).
 * La UI (botones, menús) usa eventos Pixi directamente.
 */
export const input = {
  held: new Set<string>(),
  pressedThisStep: new Set<string>(),
};

const KEY_ALIAS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function normalize(code: string): string {
  return code.startsWith("Key") ? code.slice(3) : code;
}

export function installInput(): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    const code = KEY_ALIAS.has(e.code) ? e.code : normalize(e.code);
    if (!input.held.has(code)) input.pressedThisStep.add(code);
    input.held.add(code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const code = KEY_ALIAS.has(e.code) ? e.code : normalize(e.code);
    input.held.delete(code);
  };
  const onBlur = () => input.held.clear();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}

/** Llamar al final de cada paso fijo para limpiar los "pressed" de este frame. */
export function clearPressed(): void {
  input.pressedThisStep.clear();
}
