# Issue #8: Add support for ADK Google Framework

**Source**: https://github.com/DivergerThinking/diverger-claude/issues/8
**Author**: @alvarogf93
**Complexity**: Low-Medium
**Label**: `planned`

## Overview

Add a Google ADK (Agent Development Kit) framework profile so projects using ADK get tailored Claude Code configuration automatically.

## Implementation Steps

### 1. Framework Profile (`src/profiles/registry/frameworks/google-adk.profile.ts`)

- Layer: `PROFILE_LAYERS.FRAMEWORK` (20)
- Technology: `google-adk`, parent: `python`
- Rules covering:
  - Agent class design patterns (subclassing `Agent`, `LlmAgent`)
  - Tool/action definitions (`@tool` decorator, `ToolContext`)
  - Session and state management (`SessionService`, `InMemorySessionService`)
  - Multi-agent orchestration patterns
  - gRPC and protocol buffer conventions (if applicable)
  - Security: API key handling, auth scopes, input validation
- Reference skills:
  - `google-adk-quickstart` — setup, project structure, first agent
  - `google-adk-tools-guide` — tool definition patterns, built-in tools
  - `google-adk-agents-guide` — multi-agent patterns, delegation, orchestration
- Enrichment agents: code-reviewer (ADK-aware), agent-builder

### 2. Python Analyzer Update (`src/detection/analyzers/python.ts`)

- Add to `PY_DEP_PATTERNS`:
  - `google-adk` → framework `google-adk`, confidence weight ~85
- Detect in: `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`

### 3. Profile Registration (`src/profiles/index.ts`)

- Import `googleAdkProfile` and add to `ALL_PROFILES`

### 4. Tests

- Unit test for the profile structure
- Detection test: Python project with `google-adk` dependency → detected
- Integration test: full config generation with ADK profile applied

## Acceptance Criteria

- [ ] `diverger detect` on a project with `google-adk` in deps → detects `google-adk` framework
- [ ] `diverger generate` produces ADK-specific rules, skills, and agents
- [ ] All existing tests pass
- [ ] New tests cover detection and profile composition
