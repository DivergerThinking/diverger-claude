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

- Follow Django's "batteries included" philosophy - use built-in features before third-party
- Organize code into reusable Django apps by domain (e.g., users, orders, products)
- Use Django's ORM for all database operations - avoid raw SQL unless absolutely necessary
- Define models with proper field types, validators, and Meta options
- Use class-based views (CBVs) for standard CRUD, function-based views (FBVs) for custom logic
- Use Django REST Framework for API endpoints
- Apply Django's middleware for cross-cutting concerns
- Use Django signals sparingly - prefer explicit method calls over implicit signals
- Use Django's built-in admin for internal data management
- Manage database schema changes with Django migrations
- Use Django's template engine with template inheritance for server-rendered pages
- Keep settings modular: base.py, local.py, production.py`,
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
        ],
      },
    },
    rules: [
      {
        path: 'django/architecture.md',
        governance: 'mandatory',
        description: 'Django models, views, and ORM patterns',
        content: `# Django Architecture

## App Organization
- Each app should represent a single domain concept (users, orders, inventory)
- Keep apps small and focused - split large apps when they grow
- Use \`apps.py\` to configure app metadata and ready() for startup logic
- Place shared utilities in a \`common\` or \`core\` app

## Models
- Define all fields with explicit types and appropriate constraints
- Use \`CharField\` with \`max_length\`, \`TextField\` for unbounded text
- Add \`db_index=True\` on fields used in filters and lookups
- Use \`ForeignKey\` with explicit \`on_delete\` behavior (CASCADE, PROTECT, SET_NULL)
- Define \`__str__\` for readable representation in admin and debugging
- Use \`Meta\` class for ordering, unique constraints, verbose names
- Add custom managers for common query patterns
- Use model methods for domain logic that operates on a single instance
- Never put view logic in models - keep them focused on data and domain rules

## Views
- Use class-based views for standard patterns: ListView, DetailView, CreateView, UpdateView
- Use function-based views for non-standard or complex request handling
- For APIs, use Django REST Framework serializers, viewsets, and routers
- Keep views thin: validate input, call service/model logic, return response
- Use \`get_object_or_404\` for single object lookups

## ORM Best Practices
- Use \`select_related()\` for ForeignKey / OneToOne to prevent N+1 queries
- Use \`prefetch_related()\` for reverse ForeignKey / ManyToMany relationships
- Use \`values()\` or \`values_list()\` when you only need specific fields
- Use \`F()\` expressions for database-level updates
- Use \`Q()\` objects for complex query conditions
- Use \`annotate()\` and \`aggregate()\` for database-level computations
- Use \`bulk_create()\` and \`bulk_update()\` for batch operations
- Profile queries with django-debug-toolbar in development

## Middleware
- Use Django's built-in middleware stack (security, session, auth, CSRF)
- Write custom middleware as a class with \`__init__\` and \`__call__\`
- Keep middleware lightweight - it runs on every request
- Order middleware carefully: security first, then session, then auth

## Signals
- Use signals sparingly - they create implicit coupling
- Prefer explicit method calls or model save() overrides for simple cases
- Use signals for truly decoupled cross-app communication
- Always use \`dispatch_uid\` to prevent duplicate signal connections
`,
      },
      {
        path: 'django/admin-templates.md',
        governance: 'recommended',
        description: 'Django admin and template patterns',
        content: `# Django Admin and Templates

## Admin Configuration
- Register all models that need internal management
- Use \`list_display\` for useful column views
- Use \`list_filter\` and \`search_fields\` for filtering and search
- Use \`readonly_fields\` for computed or sensitive fields
- Create custom admin actions for bulk operations
- Use inline models for parent-child relationships

## Template Patterns
- Use template inheritance: base.html -> section.html -> page.html
- Use \`{% block %}\` for overridable sections
- Keep logic out of templates - use template tags and filters for formatting
- Use \`{% include %}\` for reusable components
- Use \`{% url %}\` for URL generation - never hardcode URLs
- Use the \`{% csrf_token %}\` tag in all forms

## Settings Organization
- Split settings: base.py (shared), local.py (development), production.py
- Use environment variables for secrets and environment-specific values
- Use \`django-environ\` or \`python-decouple\` for environment parsing
- Never commit secrets or production settings to version control
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Django-Specific Review
- Check for N+1 queries: verify select_related() and prefetch_related() usage
- Verify models have proper field constraints, validators, and __str__ methods
- Check for raw SQL that should use the ORM
- Verify views are thin - no business logic in views
- Check migration files are present and consistent with model changes
- Verify CSRF protection is active on all form submissions
- Check for proper use of get_object_or_404 instead of bare try/except
- Verify signals are used sparingly and have dispatch_uid
- Check settings do not contain hardcoded secrets
- Verify admin registrations have useful list_display and search_fields`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Django Testing
- Use Django's TestCase for tests that need database access
- Use \`Client\` or \`RequestFactory\` for view tests
- Use \`baker\` (model-bakery) or factory_boy for test data generation
- Test model methods and custom managers independently
- Test views: GET/POST, permissions, redirects, template context
- Test forms: valid data, invalid data, custom validation
- Test API endpoints with DRF's APITestCase if using Django REST Framework
- Use \`override_settings\` for tests that depend on configuration
- Test migrations: verify forwards and backwards compatibility`,
      },
    ],
  },
};
