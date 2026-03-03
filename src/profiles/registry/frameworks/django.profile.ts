import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const djangoProfile: Profile = {
  id: 'frameworks/django',
  name: 'Django',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['django'],
  contributions: {
    claudeMd: [
      {
        heading: 'Django Conventions',
        order: 20,
        content: `## Django Conventions

Django's "batteries included" philosophy. Convention-driven, ORM-centric, MTV architecture.

**Detailed rules:** see \`.claude/rules/django/\` directory.

**Key rules:**
- Fat models, thin views — business logic in models/managers, not views
- QuerySet chaining for DB access, \`select_related\`/\`prefetch_related\` to avoid N+1
- Forms/serializers for all input validation, never trust request data directly
- Migrations are forward-only in production — test migrations before deploying`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
          'Bash(python manage.py:*)',
          'Bash(django-admin:*)',
          'Bash(pytest:*)',
          'Bash(celery:*)',
          'Bash(gunicorn:*)',
          'Bash(uvicorn:*)',
        ],
      },
    },
    rules: [
      {
        path: 'django/models-and-orm.md',
        paths: ['**/*.py', '**/views.py', '**/models.py', '**/urls.py'],
        governance: 'mandatory',
        description: 'Django model design, ORM patterns, and query optimization',
        content: `# Django Models & ORM

## Model Design — Class Member Order (official Django style)
1. Database fields
2. Custom manager attributes
3. \`class Meta\` (ordering, constraints, indexes, verbose_name)
4. \`__str__\` and magic methods
5. \`save()\` / \`delete()\` overrides
6. \`get_absolute_url()\`
7. Custom methods and properties

## Model Field Rules
- Always specify \`on_delete\` on ForeignKey (CASCADE, PROTECT, SET_NULL)
- Use \`related_name\` on all FK/M2M fields for explicit reverse access
- Use TextChoices/IntegerChoices for status fields — no magic strings
- Add \`db_index=True\` on fields used in WHERE/ORDER BY clauses
- Use \`auto_now_add\` / \`auto_now\` for timestamp fields
- Define constraints (UniqueConstraint) and indexes in Meta

## Custom Managers and QuerySets
- Create custom QuerySet subclass with chainable filter methods (published, by_author, recent)
- Create custom Manager that returns the QuerySet subclass via \`get_queryset()\`
- Use \`Article.published.all()\` for pre-filtered access — chainable and expressive

## ORM Query Optimization
- Use \`select_related()\` for ForeignKey/OneToOne (SQL JOIN) to prevent N+1
- Use \`prefetch_related()\` for reverse FK/ManyToMany (separate query + Python join)
- Use \`F()\` for database-level field operations (atomic increment, comparisons)
- Use \`Q()\` for complex AND/OR/NOT logic
- Use \`annotate()\` / \`aggregate()\` for Count, Avg, Sum at DB level
- Use \`bulk_create()\` / \`bulk_update()\` with batch_size for batch operations
- Use \`exists()\` instead of \`len(queryset)\` — avoid loading all rows
- Use \`values()\` / \`values_list()\` when you only need specific fields
- Filter at the database level — never load all objects and filter in Python
`,
      },
      {
        path: 'django/views-urls-forms.md',
        paths: ['**/*.py', '**/views.py', '**/models.py', '**/urls.py'],
        governance: 'mandatory',
        description: 'Django views, URL configuration, forms, and request handling',
        content: `# Django Views, URLs & Forms

## Views
- FBVs for non-standard logic; CBVs (ListView, DetailView, CreateView) for standard CRUD
- Use \`@login_required\` / LoginRequiredMixin for auth-protected views
- Use \`@require_http_methods\` to restrict allowed HTTP methods
- Use \`get_object_or_404()\` — never manual try/except for object lookup
- Keep views thin — business logic belongs in models or services
- Override \`get_queryset()\` in CBVs to add select_related/prefetch_related
- Use \`form_valid()\` to set request.user on form instances before saving

## URL Configuration
- Set \`app_name\` in each app's urls.py for namespacing
- Use \`path()\` with type converters (<slug:slug>, <int:pk>) — avoid re_path when possible
- Use \`include()\` in project urls.py to delegate to app-level URL configs
- Use \`{% url 'namespace:name' %}\` in templates — never hardcode URLs

## Forms and Validation
- Use ModelForm with explicit \`fields\` list — never \`fields = "__all__"\`
- Implement \`clean_<field>()\` for field-specific validation
- Implement \`clean()\` for cross-field validation
- Raise ValidationError with descriptive messages

## Templates
- \`{% extends %}\` must be the first non-comment line
- Use template inheritance: base.html -> section.html -> page.html
- Use \`{% csrf_token %}\` in every POST form
- Keep logic out of templates — use custom template tags/filters
- Spacing: \`{{ variable }}\`, \`{% tag %}\` — one space between braces and content
`,
      },
      {
        path: 'django/security-and-settings.md',
        paths: ['**/*.py', '**/views.py', '**/models.py', '**/urls.py'],
        governance: 'mandatory',
        description: 'Django security configuration, CSRF, XSS, and settings management',
        content: `# Django Security & Settings

## Built-in Protections — Keep Them Active
- CsrfViewMiddleware — NEVER remove; use \`csrf_exempt\` sparingly
- SecurityMiddleware — HSTS, SSL redirect, security headers
- XFrameOptionsMiddleware — prevents clickjacking
- Template auto-escaping — NEVER disable unless content is sanitized

## Production Settings
- \`DEBUG = False\`, \`SECRET_KEY\` from env (never hardcoded), \`ALLOWED_HOSTS\` explicit list
- HTTPS: \`SECURE_SSL_REDIRECT = True\`, \`SESSION_COOKIE_SECURE = True\`, \`CSRF_COOKIE_SECURE = True\`
- HSTS: \`SECURE_HSTS_SECONDS = 31536000\`, include subdomains, preload
- Cookies: \`SESSION_COOKIE_HTTPONLY = True\`, \`CSRF_COOKIE_HTTPONLY = True\`
- Content: \`SECURE_CONTENT_TYPE_NOSNIFF = True\`, \`SECURE_REFERRER_POLICY = "same-origin"\`
- Database: \`CONN_MAX_AGE = 600\` for persistent connections

## Settings Organization
- Split into base.py (shared), local.py (dev), production.py (hardened), test.py (fast)
- Use django-environ for env var loading with type coercion
- SECRET_KEY and DATABASE_URL always from environment — never in source code
- Never access settings at module level in other modules — use lazy patterns

## CSRF Protection
- Always include \`{% csrf_token %}\` in POST forms
- For AJAX: read token from hidden input or cookie, send as X-CSRFToken header
- DRF SessionAuthentication enforces CSRF; token-based APIs do not need CSRF

## Raw SQL — Always Parameterized
- Use \`cursor.execute("... WHERE status = %s", [status])\` — never f-strings in SQL

## User-Uploaded Content Security
- Serve from separate domain to prevent same-origin XSS
- Whitelist file extensions/MIME types, enforce max upload size at web server level
- Use FileExtensionValidator on FileField/ImageField
`,
      },
      {
        path: 'django/admin-drf-deployment.md',
        paths: ['**/*.py', '**/views.py', '**/models.py', '**/urls.py'],
        governance: 'recommended',
        description: 'Django admin, DRF patterns, signals, and deployment',
        content: `# Django Admin, REST Framework & Deployment

## Admin Configuration
- Use \`@admin.register(Model)\` with custom ModelAdmin — never bare \`admin.site.register()\`
- Configure list_display, list_filter, search_fields, prepopulated_fields
- Use raw_id_fields for FK fields with many options (avoids loading all in dropdown)
- Use readonly_fields for auto-managed fields, fieldsets for form organization
- Define custom admin actions for batch operations (publish, archive)

## Django REST Framework Patterns
- Use separate serializers for list (lightweight) and detail (full) actions
- Use ModelSerializer with explicit fields and read_only_fields — never \`fields = "__all__"\`
- Implement \`validate_<field>()\` for field-level validation on serializers
- Use ModelViewSet with permission_classes, filter_backends, search_fields, ordering
- Override \`get_serializer_class()\` to return different serializers per action
- Override \`get_queryset()\` to add select_related/prefetch_related/only
- Use \`perform_create()\` to set request.user on save
- Use \`@action\` decorator for custom endpoints beyond CRUD

## Signals — Use Sparingly
- Use for truly decoupled cross-app concerns (audit logging, search index, cache invalidation)
- Do NOT use within the same app — prefer explicit method calls or save() overrides
- Always set \`dispatch_uid\` to prevent duplicate signal connections
- Keep signal handlers simple — delegate heavy work to Celery tasks

## Migrations
- Run \`makemigrations\` after every model change — commit migration files to VCS
- Review auto-generated migrations before applying
- Never edit migrations applied to production — create new ones
- Use RunPython with both code and reverse_code for data migrations
- For large tables: use \`CREATE INDEX CONCURRENTLY\` on PostgreSQL

## Deployment
- Use Gunicorn/uWSGI as WSGI server — never \`manage.py runserver\` in production
- Run behind reverse proxy (Nginx/Caddy) for TLS, rate limiting, static files
- Run \`manage.py check --deploy\` before every deployment
- Run \`migrate\` and \`collectstatic --noinput\` as part of deploy pipeline
- Use non-root user in Docker, structured JSON logging for observability
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Django-Specific Review

### Models & ORM
- [ ] Models follow official class organization: fields -> managers -> Meta -> __str__ -> save -> get_absolute_url -> custom methods
- [ ] All ForeignKey fields have explicit \`on_delete\` (CASCADE, PROTECT, SET_NULL, SET_DEFAULT)
- [ ] Fields use \`TextChoices\` / \`IntegerChoices\` enums instead of magic strings
- [ ] Fields have appropriate constraints, validators, \`max_length\`, \`db_index\`
- [ ] Models define \`__str__\` for admin/debugging readability
- [ ] Meta class includes \`ordering\`, \`constraints\`, \`indexes\`, and \`verbose_name\`
- [ ] \`select_related()\` used for ForeignKey / OneToOne to prevent N+1 queries
- [ ] \`prefetch_related()\` used for reverse FK / ManyToMany relationships
- [ ] \`F()\` expressions used for database-level field updates — no Python round-trip
- [ ] \`values()\` or \`only()\` used when full model instances are unnecessary
- [ ] \`bulk_create()\` / \`bulk_update()\` used for batch operations
- [ ] \`update_fields\` specified in \`save()\` calls when only specific fields changed
- [ ] No raw SQL unless the query is impossible with the ORM — and parameterized if present

### Views & URLs
- [ ] Views are thin — validate input, delegate to model/service, return response
- [ ] \`get_object_or_404()\` used for single object lookups (not bare try/except)
- [ ] GET and POST are explicitly differentiated (\`require_http_methods\`, CBV method dispatch)
- [ ] All URL patterns use \`app_name\` namespace and named patterns
- [ ] No hardcoded URLs — use \`{% url %}\` in templates and \`reverse()\` in Python
- [ ] CBVs used for standard CRUD; FBVs used for custom/complex logic

### Security
- [ ] \`DEBUG = False\` in production settings
- [ ] \`SECRET_KEY\` loaded from environment — never hardcoded
- [ ] \`ALLOWED_HOSTS\` is an explicit whitelist — not \`["*"]\`
- [ ] CSRF middleware is active; \`{% csrf_token %}\` in all POST forms
- [ ] No \`csrf_exempt\` without documented justification
- [ ] \`SECURE_SSL_REDIRECT\`, \`SESSION_COOKIE_SECURE\`, \`CSRF_COOKIE_SECURE\` enabled in production
- [ ] Settings not accessed at module import level — lazy evaluation used
- [ ] Signals use \`dispatch_uid\` to prevent duplicate connections
- [ ] No hardcoded database credentials in settings files
- [ ] Admin site URL is not the default \`/admin/\` in production (optional but recommended)

**Available skills:** Use \`django-model-generator\` for model scaffolding, \`django-app-scaffold\` for full app setup.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Django Testing

### Test Infrastructure
- Use Django's \`TestCase\` for tests that need database access with transaction rollback
- Use \`SimpleTestCase\` for tests that don't touch the database (forms, utils, template tags)
- Use \`TransactionTestCase\` only when testing explicit transaction behavior
- Use \`Client\` for integration-level view tests (follows redirects, checks templates)
- Use \`RequestFactory\` for unit-testing views in isolation (no middleware, no URL routing)
- Use \`APIClient\` from DRF for API endpoint tests

### Test Data
- Use \`baker.make()\` (model-bakery) or \`factory_boy\` for test data generation — avoid manual object creation
- Use \`setUpTestData\` (classmethod) for read-only data shared across all tests in a class
- Use \`setUp\` for per-test mutable data
- Use \`override_settings\` decorator for tests that depend on specific configuration
- Use fast password hasher in test settings: \`PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]\`

### What to Test
- **Models**: \`__str__\`, custom methods, property methods, clean/save overrides, custom managers
- **Views**: GET response (status, template, context), POST with valid/invalid data, redirects, permissions
- **Forms**: valid data, invalid data, custom validation, field constraints
- **Serializers (DRF)**: serialization, deserialization, field validation, read-only fields
- **API endpoints**: status codes (200, 201, 400, 401, 403, 404), response body structure, pagination, filtering
- **Migrations**: verify data migrations work forward and backward
- **Signals**: mock the receiver and assert it was called with correct args
- **Admin**: verify list_display, search, actions (optional but valuable)

**Available skills:** Use \`django-model-generator\` for model + test scaffolding, \`django-app-scaffold\` for full app with tests.

### Test Patterns
\`\`\`python
from django.test import TestCase, RequestFactory
from model_bakery import baker


class ArticleModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.author = baker.make("users.User")
        cls.article = baker.make(
            "articles.Article",
            author=cls.author,
            status=Article.Status.DRAFT,
        )

    def test_str_returns_title(self):
        self.assertEqual(str(self.article), self.article.title)

    def test_publish_sets_status_and_date(self):
        self.article.publish()
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, Article.Status.PUBLISHED)
        self.assertIsNotNone(self.article.published_at)

    def test_published_manager_excludes_drafts(self):
        baker.make("articles.Article", status=Article.Status.PUBLISHED)
        self.assertEqual(Article.published.count(), 1)
\`\`\``,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Django-Specific Security Review
- [ ] \`DEBUG = False\` in production — never True (exposes settings, SQL, file paths, stack traces)
- [ ] \`SECRET_KEY\` sourced from environment variable — not committed to source control
- [ ] \`ALLOWED_HOSTS\` contains only expected hostnames — never \`["*"]\`
- [ ] \`CsrfViewMiddleware\` present in MIDDLEWARE — \`csrf_exempt\` used sparingly with documented reason
- [ ] \`SecurityMiddleware\` present and configured (HSTS, SSL redirect, content type nosniff)
- [ ] \`XFrameOptionsMiddleware\` present to prevent clickjacking
- [ ] \`SESSION_COOKIE_SECURE = True\` and \`CSRF_COOKIE_SECURE = True\` in production
- [ ] No raw SQL with string formatting — only parameterized queries via \`%s\` placeholders
- [ ] No \`mark_safe()\` or \`|safe\` filter on user-generated content without prior sanitization
- [ ] User-uploaded files validated (extension, MIME type, size) and served from separate domain
- [ ] No secrets in settings files committed to version control
- [ ] \`manage.py check --deploy\` passes without warnings
- [ ] Password validation configured with \`AUTH_PASSWORD_VALIDATORS\`
- [ ] Admin site URL changed from default \`/admin/\` in production (reduces automated attack surface)
- [ ] CORS properly configured via django-cors-headers — no \`CORS_ALLOW_ALL_ORIGINS = True\` in production

**Available skills:** Use \`django-model-generator\` for secure model scaffolding, \`django-app-scaffold\` for full app setup with security defaults.`,
      },
    ],
    skills: [
      {
        name: 'django-model-generator',
        description: 'Generate Django models with full admin, serializer, and migration setup',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Django Model Generator

Generate a complete Django model with all supporting code:

## 1. Model Class
- Proper field types with constraints, validators, \`db_index\`
- \`TextChoices\` / \`IntegerChoices\` for enumeration fields
- \`class Meta\` with ordering, constraints, indexes, verbose_name
- \`__str__\` method
- \`get_absolute_url\` method
- Custom managers with chainable QuerySet methods

## 2. Admin Registration
\`\`\`python
@admin.register(ModelName)
class ModelNameAdmin(admin.ModelAdmin):
    list_display = [...]
    list_filter = [...]
    search_fields = [...]
    readonly_fields = [...]
    prepopulated_fields = {"slug": ("name",)}  # if applicable
    raw_id_fields = [...]  # for ForeignKey with many records
\`\`\`

## 3. DRF Serializer (if API project)
- Separate serializers: Create, Update, List, Detail
- Never expose internal fields (password_hash, is_superuser)
- Custom validators for business rules

## 4. Migration
- Run \`python manage.py makemigrations\`
- Review the generated migration
- Run \`python manage.py migrate\`

## 5. Tests
- \`__str__\` output
- Custom methods and properties
- Manager/QuerySet methods
- Validation rules (clean, validators)
- Admin list_display renders without errors
`,
      },
      {
        name: 'django-app-scaffold',
        description: 'Scaffold a complete Django app with models, views, URLs, templates, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Django App Scaffold

Scaffold a new Django app following best practices:

## 1. Create the App
\`\`\`bash
python manage.py startapp appname
\`\`\`

## 2. Standard File Structure
\`\`\`
appname/
  __init__.py
  apps.py              # App config with ready() for signal registration
  models.py            # Domain models with Meta, __str__, managers
  admin.py             # Admin registration with list_display, filters
  views.py             # CBVs for CRUD, FBVs for custom logic
  urls.py              # URL patterns with app_name namespace
  forms.py             # ModelForms with custom validation
  serializers.py       # DRF serializers (if API)
  services.py          # Business logic too complex for model methods
  signals.py           # Signal handlers (keep minimal)
  managers.py          # Custom managers and querysets (or in models.py)
  tests/
    __init__.py
    test_models.py
    test_views.py
    test_forms.py
    test_serializers.py
  templates/
    appname/
      list.html
      detail.html
      form.html
      confirm_delete.html
\`\`\`

## 3. Register in Settings
\`\`\`python
INSTALLED_APPS = [
    # ...
    "apps.appname",
]
\`\`\`

## 4. Include URLs
\`\`\`python
# project/urls.py
path("appname/", include("apps.appname.urls")),
\`\`\`
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking for raw SQL with string formatting in Django code',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/raw\\s*\\(|connection\\.cursor|execute\\s*\\(/.test(c) && !/migration|test/.test(f.toLowerCase())) {
  if (/f['\"]|%s.*%[^s]|\\.format\\(/.test(c) && /execute/.test(c)) {
    console.error('Raw SQL with string formatting detected — use parameterized queries with %s placeholders');
    process.exit(2);
  } else {
    console.error('Warning: Raw SQL detected — prefer Django ORM (QuerySet, F expressions, Q objects) unless the query is impossible with the ORM');
    process.exit(2);
  }
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking for ForeignKey without on_delete',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/models\\.ForeignKey/.test(c) && !/on_delete/.test(c)) {
  console.error('ForeignKey without on_delete detected — always specify on_delete (CASCADE, PROTECT, SET_NULL)');
  process.exit(2);
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking Django settings for security issues',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/settings.*\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/DEBUG\\s*=\\s*True/.test(c) && /production|prod/.test(f.toLowerCase())) {
  console.error('DEBUG = True in production settings — this exposes sensitive information');
  process.exit(2);
}
const warnings = [];
if (/SECRET_KEY\\s*=\\s*['\"][^'\"]*['\"]/.test(c) && !/env\\(|environ|decouple|os\\.getenv/.test(c)) {
  warnings.push('SECRET_KEY appears hardcoded — use environment variable via django-environ or os.getenv');
}
if (/ALLOWED_HOSTS\\s*=\\s*\\[\\s*['\"]\\*['\"]/.test(c)) {
  warnings.push('ALLOWED_HOSTS = [\"*\"] allows any host header — use explicit hostnames in production');
}
if (warnings.length) { console.error('Warning: ' + warnings.join(' | ')); process.exit(2); }
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          statusMessage: 'Checking for N+1 query patterns in Django code',
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.py$/.test(f) || /test|migration/.test(f.toLowerCase())) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
const noPrefetch = [];
if (/\\.objects\\.all\\(\\)|objects\\.filter\\(/.test(c)) {
  const lines = c.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/for\\s+.*\\s+in\\s+.*\\.objects\\.(all|filter)/.test(line) &&
        !/select_related|prefetch_related|values|only/.test(lines.slice(Math.max(0, i-3), i+1).join('\\n'))) {
      noPrefetch.push(i + 1);
    }
  }
}
if (noPrefetch.length > 0) {
  console.error('Warning: QuerySet iteration without select_related/prefetch_related at line(s) ' + noPrefetch.join(', ') + ' — potential N+1 query');
  process.exit(2);
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
