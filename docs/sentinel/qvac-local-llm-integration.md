# MDK + QVAC: recommended integration for local agents

**To:** QVAC team  
**From:** MDK team

## Context

MDK is an open-source Node.js framework for building tools that monitor and control physical infrastructure, primarily mining sites today. Developers from operators' in-house teams, system integrators, and the open-source community build tools on top of it.

One of MDK's key components is **Operator AI**, an agent that answers natural-language questions about a site and acts on it through custom tool calls, keeping a human in the loop.

We want to use QVAC so these agents can run LLMs locally and prompt them with site-level context.

## Goal

Our goal is to **maximize the developer experience of building and running local AI agents with MDK + QVAC**, from setting up and running a local model to connecting it to an MDK agent, with nothing leaving the machine.

## What the agent needs from QVAC

- **Models:** tested with Qwen3-4B Instruct (Q4_K_M), 16k context, reasoning budget 0, preloaded. Larger local models are opt-in.
- **How it calls them:** streaming OpenAI-compatible chat completions from `qvac serve openai` at `127.0.0.1:11500/v1`. It goes through `@qvac/ai-sdk-provider` and runs a multi-step MCP tool-calling loop.
- **Where they run:**
  - On the developer's own machine.
  - On a shared inference machine on the site network, with the agent on the same network.



## Friction today

- We install `@qvac/cli@~0.12` (~6 GB) globally. Users then copy `qvac.config.json` and must remember `--port 11500` and `--no-cancel-load-on-disconnect`.
- The first run fetches ~2.5 GB peer-to-peer, which took about 10-20 minutes.
- `qvac serve` writes KV cache entries to `~/.qvac/kv-cache` (~144 MB per 1.7k-token conversation) and never removes them.



## Ask

1. How would QVAC recommend we integrate, given your roadmap and long-term maintenance? Is there an option we haven't considered? As input, these are the options we see so far:
  - **Integrate the QVAC CLI into the MDK CLI.** `mdk` would start the models the agent needs, using a curated `qvac.config.json`.
  - **Point users to the QVAC CLI and its official docs** to serve models, so MDK has no dependency on the QVAC CLI.
2. Is there an existing integration with another Tether product, for example WDK, that we should follow?
3. Do you plan anything that removes our workarounds? For example:
  - download progress and an HTTP fallback for model fetches
  - KV cache eviction



## QVAC feedback from Opanin vs. our problem statement


| Our point                                               | QVAC feedback                                                                                                                                                                                                                                                                                                  | Action for MDK                                                                                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrap the QVAC CLI in `mdk`, or point users to QVAC docs | Don't wrap `qvac serve`. Use `@qvac/ai-sdk-provider` managed mode locally and `--base-url` for the shared machine. Managed mode handles the port, readiness, API key, and reusing or stopping the server.                                                                                                      | Make managed mode reachable and the local default (today the agent CLI always resolves to external mode). Provisioning belongs to the agent app: the app declares `@qvac` as its dependency and fetches the model when it is added. |
| Old builds, ~6 GB install                               | Our pins (`^0.6.1`, `^0.12.0`) never move past those minors on 0.x. Move to `@qvac/ai-sdk-provider@0.12` + `@qvac/cli@0.19` and keep bumping. A fresh CLI 0.18 install is ~1.9 GB on macOS arm64, about 0.5 GB more on Linux x64.                                                                              | Upgrade both together: provider 0.12 requires CLI `^0.19`.                                                                                                                                                                          |
| Must remember `--port 11500`                            | CLI 0.19 defaults to 11435, so no Ollama clash. Managed mode picks its own port.                                                                                                                                                                                                                               | Nothing in managed mode. External mode can keep 11500.                                                                                                                                                                              |
| 10–20 min peer-to-peer first download, no progress      | Download progress and an HTTP fallback URL will be added to `qvac serve` and managed mode. Until then, download once when building the bundle.                                                                                                                                                                 | Fetch the model at install or bundle time, not on first use.                                                                                                                                                                        |
| KV cache never removed                                  | Capped since SDK 0.17: 4 GiB, oldest evicted first, 24h idle TTL, so CLI 0.12 already has it. `DELETE /qvac/v1/kv_cache` clears it on demand under `qvac serve --openai`. Drop the reaper after upgrading; if it still grows, send `du -sh ~/.qvac/kv-cache`.                                                  | Confirm the cap holds after the upgrade, then deprecate and remove the reaper. The `DELETE` endpoint is not available in managed mode, which starts the server with `--no-default`.                                                 |
| Nothing leaves the machine (offline)                    | Works today if the installed QVAC packages (one copy per OS) and the model file are copied over first. A model already on disk that matches is used without touching the internet. Models kept outside `~/.qvac/models` need `cacheDirectory` in a `qvac.config.json`, with `QVAC_CONFIG_PATH` pointing at it. | Build the offline bundle from these. Experiment HTTP based fallback sourced from huggingface, S3 or any other alternative.                                                                                                          |


**Gaps we found in MDK while checking the feedback:**

- Managed mode rejects our model alias `qwen3-4b`. It needs the QVAC model ID `QWEN3_4B_INST_Q4_K_M`.
- Managed mode resolves `@qvac/cli` from the agent's own `node_modules`. Our guide installs it in a separate `~/qvac-runtime`.
- The agent CLI cannot pass an API key to a QVAC server, so it cannot reach a shared machine running CLI 0.19. The agent app can, via `apiKey` in its provider config.
- In managed mode the server opens its port only after the model has loaded, and the agent app creates the agent on the first chat session. The first operator would wait through the load, and through the download if the model is not on disk.



## Target user experience

Steps marked *(to build)* do not exist in MDK yet.

**Local (default)**

1. Install: adding the agent app (`mdk add app`) brings `@qvac/cli` with it and fetches the model file, online or from an offline bundle.
2. `mdk run`: the agent app starts the model through managed mode at startup. No `qvac serve` terminal, config file, port or flags.
3. The operator opens the chat. The UI shows that the model is loading until it is ready, then answers. 
4. Restart: if the app comes back within 5 minutes it reuses the running model. After that the model is stopped and loads again on the next start, from disk.

**Shared inference machine**

1. Shared inferernace machine runs `qvac serve --openai` on the GPU machine with our `qvac.config.json`, `--host`, `--api-key`, and `--allowed-host` if clients use a hostname.
2. The agent app config sets `baseURL` and `apiKey`. The operator's chat experience is the same as local.

