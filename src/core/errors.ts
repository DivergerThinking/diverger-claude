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

/** Error during technology detection */
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

/** Error during file generation */
export class GenerationError extends DivergerError {
  constructor(message: string) {
    super(message, 'GENERATION_ERROR');
    this.name = 'GenerationError';
  }
}

/** Error during three-way merge */
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
      'API key no configurada. Define la variable de entorno ANTHROPIC_API_KEY.',
      'API_KEY_ERROR',
    );
    this.name = 'ApiKeyError';
  }
}

/** Error when target directory is not a valid project */
export class InvalidProjectError extends DivergerError {
  constructor(dir: string) {
    super(
      `El directorio "${dir}" no parece ser un proyecto válido. No se encontraron archivos de manifiesto.`,
      'INVALID_PROJECT',
    );
    this.name = 'InvalidProjectError';
  }
}

/** Conflict in profile composition that cannot be auto-resolved */
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
