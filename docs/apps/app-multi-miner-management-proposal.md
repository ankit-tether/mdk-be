# Proposal: Multi-Miner Management App

> **Date:** 2026-08-12  |  **Status:** Proposal

## Name

Multi-Miner Management

## Description

> Running a mix of Antminer, Whatsminer, and Avalon machines and unable to monitor and manage them from one place? Install this App on your MDK Stack.

## The problem we are solving

Mixed fleets are the norm — Antminers, Whatsminers, and Avalons side by side. Each brand ships its own dashboard and its own API, so the operator runs three tools that disagree with each other, has no single fleet-wide hashrate or power figure, and repeats every action three different ways.

The only existing fix is a closed, proprietary platform that trades the problem for lock-in. **MDK solves it in the open** — installed, not built.

The industry response so far has been closed, proprietary platforms that solve this by locking the operator in. **MDK's answer is to solve it in the open** — and the Multi-Miner Management App is that answer, packaged so it can be installed rather than built.

## What does it include?



### Worker Plugins

- **Antminer Worker** — monitors and manages a single Antminer. Its capabilities are exactly those provided by the official API documentation.
- **Whatsminer Worker** — monitors and manages a single Whatsminer. Its capabilities are exactly those provided by the official API documentation.
- **Avalon Worker** — monitors and manages a single Avalon. Its capabilities are exactly those provided by the official API documentation.



### Gateway Plugin

- **Multi-Miner Gateway Plugin** — normalizes data across all three types of miner, provides generic APIs to manage all three, and exposes APIs such as `ListMiners`, `GetHashRate`, `GetAggregatedHashRate`, `SetMiningPool`, and `SetPowerMode`.



### UI Plugin

- **UI Pages** — integrated with the APIs from the Multi-Miner Gateway Plugin to visualize all the data, and to provide the user interface for monitoring and managing all three types of miner.



####  Why this App, first
> 
> - **Widest pain.** Mixed fleets are the norm, not a niche.
> - **Proves the architecture** — Workers, Gateway, UI, contracts, and AI, all exercised at once on real hardware.
> - **Achievable now.** The three Workers already exist.
> - **Sets the pattern.** Every App after this one gets cheaper.

