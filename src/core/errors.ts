/** Base error class for diverger-claude */
export class DivergerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DivergerError';
  }
}

/** Error during technology detection (analyzer failures, invalid manifests) */
export class DetectionError extends DivergerError {
  constructor(message: string) {
    super(message, 'DETECTION_ERROR');
    this.name = 'DetectionError';
  }
}

/** Error during profile composition */
export class CompositionError extends DivergerError {
  constructor(message: string) {
    super(message, 'COMPOSITION_ERROR');
    this.name = 'CompositionError';
  }
}

/** Error during file generation (template rendering, file writing) */
export class GenerationError extends DivergerError {
  constructor(message: string) {
    super(message, 'GENERATION_ERROR');
    this.name = 'GenerationError';
  }
}

/** Error during three-way merge of configuration files */
export class MergeError extends DivergerError {
  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(message, 'MERGE_ERROR');
    this.name = 'MergeError';
  }
}

/** Error during governance validation */
export class GovernanceError extends DivergerError {
  constructor(
    message: string,
    public readonly rulePath: string,
  ) {
    super(message, 'GOVERNANCE_ERROR');
    this.name = 'GovernanceError';
  }
}

/** Error during knowledge fetch (Claude API) */
export class KnowledgeError extends DivergerError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_ERROR');
    this.name = 'KnowledgeError';
  }
}

/** Error when API key is missing or invalid */
export class ApiKeyError extends DivergerError {
  constructor() {
    super(
      'ANTHROPIC_API_KEY no configurada. La búsqueda de best practices online es opcional — los profiles ya incluyen best practices embebidas. ' +
      'Si deseas el enriquecimiento extra, define ANTHROPIC_API_KEY.',
      'API_KEY_ERROR',
    );
    this.name = 'ApiKeyError';
  }
}

/** Error when the API account has insufficient credits */
export class BillingError extends DivergerError {
  constructor() {
    super(
      'Sin créditos en la cuenta de Anthropic API. Continuando sin búsqueda de best practices online (los profiles ya incluyen best practices embebidas). ' +
      'Para habilitar la búsqueda, compra créditos en https://console.anthropic.com/settings/plans.',
      'BILLING_ERROR',
    );
    this.name = 'BillingError';
  }
}

/** Error when the target directory is not a valid project */
export class InvalidProjectError extends DivergerError {
  constructor(dir: string) {
    super(
      `El directorio "${dir}" no parece ser un proyecto válido. No se encontraron archivos de manifiesto.`,
      'INVALID_PROJECT',
    );
    this.name = 'InvalidProjectError';
  }
}

/** Error when two profiles have conflicting contributions */
export class ProfileConflictError extends CompositionError {
  constructor(
    public readonly profileA: string,
    public readonly profileB: string,
    public readonly conflictType: string,
  ) {
    super(
      `Conflicto entre profiles "${profileA}" y "${profileB}": ${conflictType}`,
    );
    this.name = 'ProfileConflictError';
  }
}

/** Error when parsing JSON, YAML, TOML, or XML content */
export class ParseError extends DivergerError {
  constructor(
    message: string,
    public readonly format: 'json' | 'yaml' | 'toml' | 'xml',
    public readonly source?: string,
  ) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
  }
}

/** Error when a value fails validation (paths, filenames, schemas) */
export class ValidationError extends DivergerError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** Error during plugin operations (install, update, download) */
export class PluginError extends DivergerError {
  constructor(message: string) {
    super(message, 'PLUGIN_ERROR');
    this.name = 'PluginError';
  }
}

/** Extract a human-readable message from an unknown catch value */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
