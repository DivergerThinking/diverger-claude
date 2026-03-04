// ============================================================================
// Language Mappings — Static registry of per-language template values
// ============================================================================

export interface LanguageContext {
  /** Language ID (e.g., "typescript", "python", "go") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Install dependencies command */
  installCmd: string;
  /** Run tests command */
  testCmd: string;
  /** Build command */
  buildCmd: string;
  /** Lint command */
  lintCmd: string;
  /** Package manager name */
  packageManager: string;
  /** Lock file name */
  lockFile: string;
  /** Dependency directory to ignore */
  depsDir: string;
  /** Manifest file */
  manifestFile: string;
  /** Source file extensions (comma-separated) */
  sourceExtensions: string;
  /** Runtime version matrix for CI (YAML array string) */
  versionMatrix: string;
}

export interface CIContext {
  /** Setup action (e.g., "actions/setup-node") */
  setupAction: string;
  /** Version input name (e.g., "node-version") */
  versionInput: string;
  /** Cache input value (e.g., "'npm'") */
  cacheInput: string;
  /** Version file (e.g., "'.node-version'") */
  versionFile: string;
  /** Publish command */
  publishCmd: string;
  /** Publish token env var name */
  publishTokenName: string;
  /** CI path triggers (YAML array string) */
  pathTriggers: string;
}

export interface DockerContext {
  /** Base image for build stage */
  buildImage: string;
  /** Base image for runtime stage */
  runtimeImage: string;
  /** COPY manifest command in Dockerfile */
  copyManifest: string;
  /** RUN install deps command */
  installDeps: string;
  /** RUN build command */
  buildStep: string;
  /** CMD entrypoint */
  entrypoint: string;
  /** Default port */
  port: string;
  /** BuildKit cache mount target */
  cacheMountTarget: string;
}

export interface LanguageMapping {
  lang: LanguageContext;
  ci: CIContext;
  docker: DockerContext;
}

/** All supported language mappings */
export const LANGUAGE_MAPPINGS: Record<string, LanguageMapping> = {
  typescript: {
    lang: {
      id: 'typescript',
      name: 'TypeScript',
      installCmd: 'npm ci',
      testCmd: 'npm test',
      buildCmd: 'npm run build',
      lintCmd: 'npm run lint',
      packageManager: 'npm',
      lockFile: 'package-lock.json',
      depsDir: 'node_modules',
      manifestFile: 'package.json',
      sourceExtensions: 'ts,tsx',
      versionMatrix: '[18, 20, 22]',
    },
    ci: {
      setupAction: 'actions/setup-node',
      versionInput: 'node-version',
      cacheInput: 'npm',
      versionFile: '.node-version',
      publishCmd: 'npm publish',
      publishTokenName: 'NPM_TOKEN',
      pathTriggers: "['src/**', 'package.json', 'package-lock.json']",
    },
    docker: {
      buildImage: 'node:20-alpine',
      runtimeImage: 'node:20-alpine',
      copyManifest: 'COPY package*.json ./',
      installDeps: 'RUN npm ci --ignore-scripts',
      buildStep: 'RUN npm run build',
      entrypoint: '["node", "dist/index.js"]',
      port: '3000',
      cacheMountTarget: '/root/.npm',
    },
  },

  javascript: {
    lang: {
      id: 'javascript',
      name: 'JavaScript',
      installCmd: 'npm ci',
      testCmd: 'npm test',
      buildCmd: 'npm run build',
      lintCmd: 'npm run lint',
      packageManager: 'npm',
      lockFile: 'package-lock.json',
      depsDir: 'node_modules',
      manifestFile: 'package.json',
      sourceExtensions: 'js,jsx',
      versionMatrix: '[18, 20, 22]',
    },
    ci: {
      setupAction: 'actions/setup-node',
      versionInput: 'node-version',
      cacheInput: 'npm',
      versionFile: '.node-version',
      publishCmd: 'npm publish',
      publishTokenName: 'NPM_TOKEN',
      pathTriggers: "['src/**', 'package.json', 'package-lock.json']",
    },
    docker: {
      buildImage: 'node:20-alpine',
      runtimeImage: 'node:20-alpine',
      copyManifest: 'COPY package*.json ./',
      installDeps: 'RUN npm ci --ignore-scripts',
      buildStep: 'RUN npm run build',
      entrypoint: '["node", "index.js"]',
      port: '3000',
      cacheMountTarget: '/root/.npm',
    },
  },

  python: {
    lang: {
      id: 'python',
      name: 'Python',
      installCmd: 'pip install -r requirements.txt',
      testCmd: 'pytest',
      buildCmd: 'python -m build',
      lintCmd: 'ruff check .',
      packageManager: 'pip',
      lockFile: 'requirements.txt',
      depsDir: '.venv',
      manifestFile: 'pyproject.toml',
      sourceExtensions: 'py',
      versionMatrix: "['3.11', '3.12', '3.13']",
    },
    ci: {
      setupAction: 'actions/setup-python',
      versionInput: 'python-version',
      cacheInput: 'pip',
      versionFile: '.python-version',
      publishCmd: 'twine upload dist/*',
      publishTokenName: 'PYPI_TOKEN',
      pathTriggers: "['src/**', 'pyproject.toml', 'requirements*.txt']",
    },
    docker: {
      buildImage: 'python:3.12-slim',
      runtimeImage: 'python:3.12-slim',
      copyManifest: 'COPY requirements*.txt ./',
      installDeps: 'RUN pip install --no-cache-dir -r requirements.txt',
      buildStep: 'RUN python -m build',
      entrypoint: '["python", "-m", "app"]',
      port: '8000',
      cacheMountTarget: '/root/.cache/pip',
    },
  },

  go: {
    lang: {
      id: 'go',
      name: 'Go',
      installCmd: 'go mod download',
      testCmd: 'go test ./...',
      buildCmd: 'go build ./...',
      lintCmd: 'golangci-lint run',
      packageManager: 'go',
      lockFile: 'go.sum',
      depsDir: '',
      manifestFile: 'go.mod',
      sourceExtensions: 'go',
      versionMatrix: "['1.21', '1.22', '1.23']",
    },
    ci: {
      setupAction: 'actions/setup-go',
      versionInput: 'go-version',
      cacheInput: '',
      versionFile: 'go.mod',
      publishCmd: 'goreleaser release',
      publishTokenName: 'GITHUB_TOKEN',
      pathTriggers: "['**/*.go', 'go.mod', 'go.sum']",
    },
    docker: {
      buildImage: 'golang:1.22-alpine',
      runtimeImage: 'gcr.io/distroless/static-debian12',
      copyManifest: 'COPY go.mod go.sum ./',
      installDeps: 'RUN go mod download',
      buildStep: 'RUN CGO_ENABLED=0 go build -o /app ./cmd/server',
      entrypoint: '["/app"]',
      port: '8080',
      cacheMountTarget: '/root/.cache/go-build',
    },
  },

  rust: {
    lang: {
      id: 'rust',
      name: 'Rust',
      installCmd: 'cargo fetch',
      testCmd: 'cargo test',
      buildCmd: 'cargo build --release',
      lintCmd: 'cargo clippy -- -D warnings',
      packageManager: 'cargo',
      lockFile: 'Cargo.lock',
      depsDir: 'target',
      manifestFile: 'Cargo.toml',
      sourceExtensions: 'rs',
      versionMatrix: "['stable', 'nightly']",
    },
    ci: {
      setupAction: 'dtolnay/rust-toolchain',
      versionInput: 'toolchain',
      cacheInput: '',
      versionFile: 'rust-toolchain.toml',
      publishCmd: 'cargo publish',
      publishTokenName: 'CARGO_REGISTRY_TOKEN',
      pathTriggers: "['src/**', 'Cargo.toml', 'Cargo.lock']",
    },
    docker: {
      buildImage: 'rust:1.77-alpine',
      runtimeImage: 'gcr.io/distroless/cc-debian12',
      copyManifest: 'COPY Cargo.toml Cargo.lock ./',
      installDeps: 'RUN cargo fetch',
      buildStep: 'RUN cargo build --release',
      entrypoint: '["/app"]',
      port: '8080',
      cacheMountTarget: '/usr/local/cargo/registry',
    },
  },

  java: {
    lang: {
      id: 'java',
      name: 'Java',
      installCmd: 'mvn dependency:resolve',
      testCmd: 'mvn test',
      buildCmd: 'mvn package -DskipTests',
      lintCmd: 'mvn checkstyle:check',
      packageManager: 'maven',
      lockFile: 'pom.xml',
      depsDir: '',
      manifestFile: 'pom.xml',
      sourceExtensions: 'java',
      versionMatrix: "['17', '21']",
    },
    ci: {
      setupAction: 'actions/setup-java',
      versionInput: 'java-version',
      cacheInput: 'maven',
      versionFile: '',
      publishCmd: 'mvn deploy',
      publishTokenName: 'MAVEN_TOKEN',
      pathTriggers: "['src/**', 'pom.xml']",
    },
    docker: {
      buildImage: 'eclipse-temurin:21-jdk-alpine',
      runtimeImage: 'eclipse-temurin:21-jre-alpine',
      copyManifest: 'COPY pom.xml ./',
      installDeps: 'RUN mvn dependency:resolve',
      buildStep: 'RUN mvn package -DskipTests',
      entrypoint: '["java", "-jar", "target/app.jar"]',
      port: '8080',
      cacheMountTarget: '/root/.m2/repository',
    },
  },

  csharp: {
    lang: {
      id: 'csharp',
      name: 'C#',
      installCmd: 'dotnet restore',
      testCmd: 'dotnet test',
      buildCmd: 'dotnet build --configuration Release',
      lintCmd: 'dotnet format --verify-no-changes',
      packageManager: 'nuget',
      lockFile: 'packages.lock.json',
      depsDir: '',
      manifestFile: '*.csproj',
      sourceExtensions: 'cs',
      versionMatrix: "['8.0', '9.0']",
    },
    ci: {
      setupAction: 'actions/setup-dotnet',
      versionInput: 'dotnet-version',
      cacheInput: '',
      versionFile: 'global.json',
      publishCmd: 'dotnet nuget push',
      publishTokenName: 'NUGET_API_KEY',
      pathTriggers: "['src/**', '**/*.csproj', '**/*.sln']",
    },
    docker: {
      buildImage: 'mcr.microsoft.com/dotnet/sdk:8.0-alpine',
      runtimeImage: 'mcr.microsoft.com/dotnet/aspnet:8.0-alpine',
      copyManifest: 'COPY *.csproj ./',
      installDeps: 'RUN dotnet restore',
      buildStep: 'RUN dotnet publish -c Release -o /app',
      entrypoint: '["dotnet", "app.dll"]',
      port: '8080',
      cacheMountTarget: '/root/.nuget/packages',
    },
  },

  dart: {
    lang: {
      id: 'dart',
      name: 'Dart',
      installCmd: 'dart pub get',
      testCmd: 'dart test',
      buildCmd: 'dart compile exe bin/main.dart',
      lintCmd: 'dart analyze',
      packageManager: 'pub',
      lockFile: 'pubspec.lock',
      depsDir: '.dart_tool',
      manifestFile: 'pubspec.yaml',
      sourceExtensions: 'dart',
      versionMatrix: "['stable', 'beta']",
    },
    ci: {
      setupAction: 'dart-lang/setup-dart',
      versionInput: 'sdk',
      cacheInput: '',
      versionFile: '',
      publishCmd: 'dart pub publish --force',
      publishTokenName: 'PUB_TOKEN',
      pathTriggers: "['lib/**', 'bin/**', 'pubspec.yaml']",
    },
    docker: {
      buildImage: 'dart:stable',
      runtimeImage: 'gcr.io/distroless/cc-debian12',
      copyManifest: 'COPY pubspec.* ./',
      installDeps: 'RUN dart pub get',
      buildStep: 'RUN dart compile exe bin/main.dart -o /app/server',
      entrypoint: '["/app/server"]',
      port: '8080',
      cacheMountTarget: '/root/.pub-cache',
    },
  },

  kotlin: {
    lang: {
      id: 'kotlin',
      name: 'Kotlin',
      installCmd: 'gradle dependencies',
      testCmd: 'gradle test',
      buildCmd: 'gradle build',
      lintCmd: 'gradle ktlintCheck',
      packageManager: 'gradle',
      lockFile: 'gradle.lockfile',
      depsDir: '.gradle',
      manifestFile: 'build.gradle.kts',
      sourceExtensions: 'kt,kts',
      versionMatrix: "['17', '21']",
    },
    ci: {
      setupAction: 'actions/setup-java',
      versionInput: 'java-version',
      cacheInput: 'gradle',
      versionFile: '',
      publishCmd: 'gradle publish',
      publishTokenName: 'MAVEN_TOKEN',
      pathTriggers: "['src/**', 'build.gradle.kts', 'settings.gradle.kts']",
    },
    docker: {
      buildImage: 'eclipse-temurin:21-jdk-alpine',
      runtimeImage: 'eclipse-temurin:21-jre-alpine',
      copyManifest: 'COPY build.gradle.kts settings.gradle.kts ./',
      installDeps: 'RUN gradle dependencies --no-daemon',
      buildStep: 'RUN gradle build --no-daemon',
      entrypoint: '["java", "-jar", "build/libs/app.jar"]',
      port: '8080',
      cacheMountTarget: '/root/.gradle/caches',
    },
  },

  swift: {
    lang: {
      id: 'swift',
      name: 'Swift',
      installCmd: 'swift package resolve',
      testCmd: 'swift test',
      buildCmd: 'swift build -c release',
      lintCmd: 'swiftlint',
      packageManager: 'spm',
      lockFile: 'Package.resolved',
      depsDir: '.build',
      manifestFile: 'Package.swift',
      sourceExtensions: 'swift',
      versionMatrix: "['5.9', '5.10']",
    },
    ci: {
      setupAction: 'swift-actions/setup-swift',
      versionInput: 'swift-version',
      cacheInput: '',
      versionFile: '.swift-version',
      publishCmd: '',
      publishTokenName: '',
      pathTriggers: "['Sources/**', 'Package.swift']",
    },
    docker: {
      buildImage: 'swift:5.10-jammy',
      runtimeImage: 'ubuntu:22.04',
      copyManifest: 'COPY Package.swift Package.resolved ./',
      installDeps: 'RUN swift package resolve',
      buildStep: 'RUN swift build -c release',
      entrypoint: '[".build/release/App"]',
      port: '8080',
      cacheMountTarget: '/root/.cache/org.swift.swiftpm',
    },
  },

  ruby: {
    lang: {
      id: 'ruby',
      name: 'Ruby',
      installCmd: 'bundle install',
      testCmd: 'bundle exec rspec',
      buildCmd: 'bundle exec rake build',
      lintCmd: 'bundle exec rubocop',
      packageManager: 'bundler',
      lockFile: 'Gemfile.lock',
      depsDir: 'vendor/bundle',
      manifestFile: 'Gemfile',
      sourceExtensions: 'rb,erb',
      versionMatrix: "['3.2', '3.3']",
    },
    ci: {
      setupAction: 'ruby/setup-ruby',
      versionInput: 'ruby-version',
      cacheInput: 'bundler',
      versionFile: '.ruby-version',
      publishCmd: 'gem push pkg/*.gem',
      publishTokenName: 'GEM_HOST_API_KEY',
      pathTriggers: "['lib/**', 'app/**', 'Gemfile', 'Gemfile.lock']",
    },
    docker: {
      buildImage: 'ruby:3.3-alpine',
      runtimeImage: 'ruby:3.3-alpine',
      copyManifest: 'COPY Gemfile Gemfile.lock ./',
      installDeps: 'RUN bundle install --without development test',
      buildStep: 'COPY . .',
      entrypoint: '["bundle", "exec", "ruby", "app.rb"]',
      port: '3000',
      cacheMountTarget: '/usr/local/bundle/cache',
    },
  },
};

/** Alias: nodejs maps to typescript context */
LANGUAGE_MAPPINGS['nodejs'] = LANGUAGE_MAPPINGS['typescript']!;

/** Default mapping when no language is detected */
export const DEFAULT_LANGUAGE_ID = 'typescript';
