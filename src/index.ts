import { createCli } from './cli/index.js';
import { showBanner } from './cli/ui/banner.js';

const program = createCli();

// Show banner when no command is provided
if (process.argv.length <= 2) {
  await showBanner();
} else {
  program.parse(process.argv);
}
