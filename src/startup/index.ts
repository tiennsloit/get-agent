import { checkContext } from "./checkContext";
import { checkLocalModel } from "./checkLocalModel";
import { checkState } from "./checkState";

/**
 * Performs various startup checks to ensure that the extension is set up correctly.
 * This includes:
 * - Checking that the state file exists and is up to date
 * - Checking that the embedding model exists and the project is embedded
 * - Checking that the local model exists
 *
 * This function should be called when the extension is activated.
 */
export async function runStartupCheck() {
  // Check that state file exists and up to date
  await checkState();

  // Check that the embedding model exists and the project is embedded
  checkContext();

  // Check that the local model exists
  checkLocalModel();
}
