import { Run, Character as CharacterType } from '../types';

/**
 * Create a character object representing a position in the runs
 *
 * @param runArray - The array of runs
 * @param run - The run index
 * @param offset - The character offset within the run
 * @returns A Character object
 */
declare function createCharacter(runArray: Run[], run: number, offset: number): CharacterType;
/**
 * Iterate over all characters in a run array.
 * This is a generator function that yields Character objects.
 *
 * @param runArray - The array of runs to iterate over
 * @yields Character objects for each character position
 */
export declare function iterateCharacters(runArray: Run[]): Generator<CharacterType>;
/**
 * Create a character object at a specific position
 */
export { createCharacter };
export default iterateCharacters;
//# sourceMappingURL=Characters.d.ts.map