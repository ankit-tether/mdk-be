import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group F — Agent enablement
export function registerSkill(program: Command): void {
  const skill = program
    .command('skill')
    .description('Coding-agent skill management (stub)');

  skill
    .command('add')
    .description('Install the MDK Developer Skill suite (stub)')
    .option('--client <client>', 'Target client: cursor | claude | codex | cline')
    .action(() => stub('skill add'));
}

export function registerMcp(program: Command): void {
  const mcp = program
    .command('mcp')
    .description('MCP registration for coding-agent clients (stub)');

  mcp
    .command('register')
    .description('Register the Gateway MCP endpoint in the client config (stub)')
    .action(() => stub('mcp register'));
}
