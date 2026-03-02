import ora, { type Ora } from 'ora';
import { extractErrorMessage } from '../../core/errors.js';
import { getOutputMode } from './logger.js';

/** Create a spinner that respects output mode */
export function createSpinner(text: string): Ora {
  const mode = getOutputMode();

  if (mode === 'quiet' || mode === 'json') {
    // Return a no-op spinner for quiet/json modes
    return ora({ text, isSilent: true });
  }

  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

/** Run an async operation with a spinner */
export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  successText?: string,
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();

  try {
    const result = await fn();
    spinner.succeed(successText ?? text);
    return result;
  } catch (err) {
    const message = extractErrorMessage(err);
    spinner.fail(`${text} - ${message}`);
    throw err;
  }
}
