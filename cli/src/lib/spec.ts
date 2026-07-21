export interface StackAnswers {
  stackName: string;
  mode: string;
  gatewayPort: number;
  kernelPort: number;
  workerBasePort: number;
  workerPackages: string[];
  gatewayPackages: string[];
}

export interface WorkerInstance {
  name: string;
  package: string;
  port: number;
  config: Record<string, unknown>;
}

export interface StackSpec {
  apiVersion: string;
  kind: string;
  metadata: { name: string };
  spec: {
    mode: string;
    kernel: { port: number };
    gateway: {
      port: number;
      plugins: Array<{ package: string; config: Record<string, unknown> }>;
    };
    workers: WorkerInstance[];
  };
}

export function shortName(pkg: string): string {
  const base = pkg.split('/').pop() ?? pkg;
  return (
    base.replace(/^mdk-worker-/, '').replace(/^mdk-plugin-/, '').replace(/^mdk-/, '') || base
  );
}

// Config is plugin-defined and opaque to the CLI; these are editable starter
// values so the generated spec is runnable-shaped for each selected plugin.
function workerConfig(pkg: string): Record<string, unknown> {
  const kind = shortName(pkg);
  return {
    pollIntervalMs: 2000,
    devices: [{ id: `${kind}-001`, host: '10.0.0.10', port: 50051, token: '${DEVICE_TOKEN}' }],
  };
}

function pluginConfig(pkg: string): Record<string, unknown> {
  if (pkg.includes('summary')) return { refreshIntervalMs: 5000 };
  if (pkg.includes('alerts')) return { evaluateIntervalMs: 10000 };
  return {};
}

/**
 * Builds the declarative stack spec (`mdk.yaml`) purely from the onboarding
 * answers. One worker instance is created per selected worker plugin, and each
 * selected gateway plugin is added under `gateway.plugins`.
 */
export function buildStackSpec(answers: StackAnswers): StackSpec {
  const workers: WorkerInstance[] = answers.workerPackages.map((pkg, i) => ({
    name: `${shortName(pkg)}-a`,
    package: pkg,
    port: answers.workerBasePort + i * 2,
    config: workerConfig(pkg),
  }));

  return {
    apiVersion: 'mdk/v1',
    kind: 'Stack',
    metadata: { name: answers.stackName },
    spec: {
      mode: answers.mode,
      kernel: { port: answers.kernelPort },
      gateway: {
        port: answers.gatewayPort,
        plugins: answers.gatewayPackages.map((pkg) => ({ package: pkg, config: pluginConfig(pkg) })),
      },
      workers,
    },
  };
}
