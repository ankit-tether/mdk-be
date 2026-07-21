import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group C — Run & manage (declarative reconciliation)
export function registerApply(program: Command): void {
  program
    .command('apply')
    .description('Declarative, idempotent reconcile from the spec (stub)')
    .requiredOption('-f, --file <path>', 'Path to the stack spec (mdk.yaml)')
    .action(() => stub('apply'));
}

export function registerDiff(program: Command): void {
  program
    .command('diff')
    .description('Preview what apply would change without touching the running stack (stub)')
    .requiredOption('-f, --file <path>', 'Path to the stack spec (mdk.yaml)')
    .action(() => stub('diff'));
}
