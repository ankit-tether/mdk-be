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
- The first run fetches ~2.5 GB peer-to-peer, which took about 10 minutes.
- `qvac serve` writes KV cache entries to `~/.qvac/kv-cache` (~144 MB per 1.7k-token conversation) and never removes them. We ship our own reaper.

## Ask

1. How would QVAC recommend we integrate, given your roadmap and long-term maintenance? As input, these are the options we see so far:
  - **Integrate the QVAC CLI into the MDK CLI.** `mdk` would start the models the agent needs, using a curated `qvac.config.json`.
  - **Point users to the QVAC CLI and its official docs** to serve models, so MDK has no dependency on the QVAC CLI.
2. Is there an existing integration, for example WDK, that we should follow?
3. Do you plan anything that removes our workarounds? For example:
  - download progress and an HTTP fallback for model fetches
  - KV cache eviction

