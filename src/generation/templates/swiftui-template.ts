import type { GeneratedFile } from '../../core/types.js';

/** Generate SwiftUI boilerplate config files */
export function generateSwiftUITemplate(projectRoot: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push({
    path: `${projectRoot}/.swiftlint.yml`,
    content: `disabled_rules:
  - trailing_whitespace

opt_in_rules:
  - empty_count
  - missing_docs
  - closure_end_indentation
  - contains_over_filter_count
  - discouraged_optional_boolean
  - explicit_init
  - first_where
  - modifier_order
  - overridden_super_call
  - pattern_matching_keywords
  - private_action
  - sorted_first_last

line_length:
  warning: 120
  error: 200

type_body_length:
  warning: 300
  error: 500

function_body_length:
  warning: 50
  error: 100
`,
  });

  return files;
}
