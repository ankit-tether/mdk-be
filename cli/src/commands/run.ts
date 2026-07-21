import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group C — Run & manage
export function registerRun(program: Command): void {
  program
    .command('run [target] [name]')
    .description(
      'Start the stack from mdk.yaml. target: all | kernel | gateway | worker (with <name>) (stub)',
    )
    .option('--detach', 'Run in the background', false)
    .action((target: string | undefined, name: string | undefined) => {
      const parts = ['run', target, name].filter(Boolean).join(' ');
      stub(parts);
    });
}
