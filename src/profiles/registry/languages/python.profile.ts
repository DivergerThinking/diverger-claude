import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const pythonProfile: Profile = {
  id: 'languages/python',
  name: 'Python',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['python'],
  contributions: {
    claudeMd: [
      {
        heading: 'Python Conventions',
        order: 10,
        content: `## Python Conventions

- Follow PEP 8 style guide
- Use type hints on all function signatures
- Use dataclasses or Pydantic models for data structures
- Prefer pathlib over os.path for file operations
- Use f-strings for string formatting
- Prefer list comprehensions over map/filter for readability
- Use context managers (with statements) for resource management
- Organize imports: stdlib → third-party → local (use isort)`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
          'Bash(pytest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'python/conventions.md',
        governance: 'mandatory',
        description: 'Python coding conventions',
        content: `# Python Conventions

## Style
- Follow PEP 8 (enforced by linter)
- Maximum line length: 88 characters (Black default)
- Use 4 spaces for indentation

## Type Hints
- Add type hints to all function parameters and return types
- Use \`from __future__ import annotations\` for forward references
- Use \`TypeAlias\` for complex type definitions
- Use \`Protocol\` for structural subtyping

## Patterns
- Use dataclasses for simple data structures
- Use Pydantic models for validated data
- Prefer \`pathlib.Path\` over \`os.path\`
- Use \`enum.Enum\` for enumerated values
- Use generators for large data processing

## Error Handling
- Use specific exception types
- Define custom exceptions for domain errors
- Use \`logging\` module, not \`print()\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Python-Specific Review
- Check for type hints on all functions
- Verify PEP 8 compliance
- Check for proper use of context managers
- Verify exception handling specificity
- Check for potential security issues (eval, exec, pickle)
- Verify import organization`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Python Testing
- Use pytest fixtures for setup/teardown
- Use parametrize for testing multiple inputs
- Mock external dependencies with unittest.mock or pytest-mock
- Test async functions with pytest-asyncio`,
      },
    ],
  },
};
