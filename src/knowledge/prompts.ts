/** Templates for knowledge search prompts */

export function bestPracticesPrompt(technology: string, version?: string): string {
  const versionStr = version ? ` ${version}` : '';
  return `What are the current best practices and coding conventions for ${technology}${versionStr}?

Focus on:
1. Code organization and project structure
2. Error handling patterns
3. Performance best practices
4. Security considerations
5. Testing strategies
6. Common anti-patterns to avoid

Provide actionable rules that can be directly used as Claude Code development rules.
Format each rule as a clear, concise instruction.`;
}

export function securityPrompt(technology: string, version?: string): string {
  const versionStr = version ? ` ${version}` : '';
  return `What are the security best practices for ${technology}${versionStr}?

Focus on:
1. OWASP Top 10 relevant to this technology
2. Authentication and authorization patterns
3. Input validation and sanitization
4. Secrets management
5. Dependency security
6. Common vulnerability patterns specific to this technology

Format as actionable security rules for code review.`;
}

export function performancePrompt(technology: string, version?: string): string {
  const versionStr = version ? ` ${version}` : '';
  return `What are the performance optimization best practices for ${technology}${versionStr}?

Focus on:
1. Common performance anti-patterns
2. Optimization techniques
3. Caching strategies
4. Memory management
5. Async/concurrent patterns
6. Build/bundle optimization

Format as actionable performance rules.`;
}
