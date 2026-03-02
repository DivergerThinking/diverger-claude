import type { GeneratedFile } from '../../core/types.js';

/** Generate Flutter boilerplate config files */
export function generateFlutterTemplate(projectRoot: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: `${projectRoot}/analysis_options.yaml`,
    content: `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_final_fields: true
    avoid_print: true
    prefer_single_quotes: true
    sort_child_properties_last: true
    use_key_in_widget_constructors: true
    prefer_const_literals_to_create_immutables: true
`,
  });

  return files;
}
