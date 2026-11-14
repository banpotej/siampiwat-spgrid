// @ts-check

/**
 * @typedef {object} SelectionActionDef A button of the selection bar (`selectionActions`).
 * @property {string} name Reported as `action` in the 'selectionAction' event; unique.
 * @property {string} label Button text (escaped).
 * @property {boolean | string} [confirm] Ask before the action runs: `true` for the built-in question
 *   (`labels.confirmSelectionAction`), or your own question text. The action does not run unless the user agrees.
 * @property {boolean} [primary] Draw it as the main button (filled).
 */

export {};
