import type { ClaudeSettings, ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, RULES_DIR, SENSITIVE_PATTERNS } from '../../core/constants.js';
import path from 'path';

/** Generate security-specific configurations */
export function generateSecurityConfig(
  _config: ComposedConfig,
  projectRoot: string,
): { rules: GeneratedFile[]; settingsOverlay: Partial<ClaudeSettings> } {
  const rules: GeneratedFile[] = [];

  // Security deny rules are already in universal profile settings
  // This generates additional security hooks and sandbox config

  const denyPatterns = SENSITIVE_PATTERNS.flatMap((p) => [
    `Read(${p})`,
    `Edit(${p})`,
    `Write(${p})`,
  ]);

  const settingsOverlay: Partial<ClaudeSettings> = {
    permissions: {
      deny: denyPatterns,
    },
    sandbox: {
      filesystem: {
        denyRead: [
          '~/.aws/credentials',
          '~/.ssh/**',
          '~/.gnupg/**',
          '~/.config/gh/hosts.yml',
        ],
      },
    },
  };

  // Generate security validation rule
  rules.push({
    path: path.join(projectRoot, CLAUDE_DIR, RULES_DIR, 'security/sensitive-data.md'),
    content: `# Sensitive Data Protection

## Absolute Rules (NEVER violate)
- NEVER read .env files, .pem files, credential files, or SSH keys
- NEVER output API keys, passwords, tokens, or secrets in responses
- NEVER commit sensitive data to version control
- NEVER log PII (personally identifiable information) in plain text

## Protected File Patterns
${SENSITIVE_PATTERNS.map((p) => `- \`${p}\``).join('\n')}

## When Working with Config Files
- Use environment variables for secrets, never hardcoded values
- Reference \`.env.example\` for required variables, not \`.env\`
- Use secret management services for production credentials
`,
    governance: 'mandatory',
  });

  return { rules, settingsOverlay };
}
