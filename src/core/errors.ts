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

/** @planned — pendiente de integración en detection pipeline error paths */
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

/** @planned — pendiente de integración en generation pipeline error paths */
export class GenerationError extends DivergerError {
  constructor(message: string) {
    super(message, 'GENERATION_ERROR');
    this.name = 'GenerationError';
  }
}

/** @planned — pendiente de integración en merge pipeline error paths */
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

/** Error when the API account has insufficient credits */
export class BillingError extends DivergerError {
  constructor() {
    super(
      'Sin créditos en la cuenta de Anthropic API. La suscripción a Claude (Max/Pro) no incluye créditos de API. ' +
      'Compra créditos en https://console.anthropic.com/settings/plans o usa --force para omitir la búsqueda de best practices.',
      'BILLING_ERROR',
    );
    this.name = 'BillingError';
  }
}

/** @planned — pendiente de integración en CLI validation error paths */
export class InvalidProjectError extends DivergerError {
  constructor(dir: string) {
    super(
      `El directorio "${dir}" no parece ser un proyecto válido. No se encontraron archivos de manifiesto.`,
      'INVALID_PROJECT',
    );
    this.name = 'InvalidProjectError';
  }
}

/** @planned — pendiente de integración en profile composition error paths */
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
