import { BaseAnalyzer } from './base.js';
import { NodeAnalyzer } from './node.js';
import { PythonAnalyzer } from './python.js';
import { JavaAnalyzer } from './java.js';
import { GoAnalyzer } from './go.js';
import { RustAnalyzer } from './rust.js';
import { DotnetAnalyzer } from './dotnet.js';
import { DockerAnalyzer } from './docker.js';
import { CIAnalyzer } from './ci.js';

/** Get all registered analyzers */
export function getAllAnalyzers(): BaseAnalyzer[] {
  return [
    new NodeAnalyzer(),
    new PythonAnalyzer(),
    new JavaAnalyzer(),
    new GoAnalyzer(),
    new RustAnalyzer(),
    new DotnetAnalyzer(),
    new DockerAnalyzer(),
    new CIAnalyzer(),
  ];
}

export { BaseAnalyzer } from './base.js';
export { NodeAnalyzer } from './node.js';
export { PythonAnalyzer } from './python.js';
export { JavaAnalyzer } from './java.js';
export { GoAnalyzer } from './go.js';
export { RustAnalyzer } from './rust.js';
export { DotnetAnalyzer } from './dotnet.js';
export { DockerAnalyzer } from './docker.js';
export { CIAnalyzer } from './ci.js';
