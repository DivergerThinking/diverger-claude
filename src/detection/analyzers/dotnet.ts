import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseXml } from '../../utils/parsers.js';

export class DotnetAnalyzer extends BaseAnalyzer {
  readonly id = 'dotnet';
  readonly name = '.NET';
  readonly filePatterns = ['*.csproj', '*.sln', '*.fsproj'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    for (const [filePath, content] of files) {
      if (filePath.endsWith('.csproj') || filePath.endsWith('.fsproj')) {
        analyzedFiles.push(filePath);

        const lang = filePath.endsWith('.fsproj') ? 'fsharp' : 'csharp';
        const langName = lang === 'fsharp' ? 'F#' : 'C#';

        if (!technologies.some((t) => t.id === lang)) {
          technologies.push({
            id: lang,
            name: langName,
            category: 'language',
            confidence: 95,
            evidence: [{ source: filePath, type: 'manifest', description: `${filePath} found`, weight: 95 }],
            profileIds: lang === 'csharp' ? ['languages/csharp'] : [],
          });
        }

        try {
          const parsed = parseXml<Record<string, unknown>>(content, filePath);
          const projStr = JSON.stringify(parsed);

          if (projStr.includes('Microsoft.AspNetCore') || projStr.includes('Microsoft.NET.Sdk.Web')) {
            if (!technologies.some((t) => t.id === 'aspnet')) {
              technologies.push({
                id: 'aspnet',
                name: 'ASP.NET Core',
                category: 'framework',
                confidence: 90,
                evidence: [{ source: filePath, type: 'manifest', description: 'ASP.NET Core SDK reference found', weight: 90 }],
                profileIds: [],
              });
            }
          }

          // Detect target framework version
          const tfMatch = projStr.match(/net(\d+)\.\d+/);
          if (tfMatch) {
            const dotnetTech = technologies.find((t) => t.id === lang);
            if (dotnetTech) {
              dotnetTech.version = `net${tfMatch[0]}`;
              dotnetTech.majorVersion = parseInt(tfMatch[1]!, 10);
            }
          }
        } catch {
          // Continue without deep analysis
        }
      }

      if (filePath.endsWith('.sln')) {
        analyzedFiles.push(filePath);
      }
    }

    return { technologies, analyzedFiles };
  }
}
