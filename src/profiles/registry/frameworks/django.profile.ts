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

Django model design, ORM patterns, and query optimization following official Django style.

**Key rules:**
- Follow official class member order: fields, managers, Meta, __str__, save/delete, get_absolute_url, custom methods
- Always specify \`on_delete\` on ForeignKey, use \`related_name\` on all FK/M2M fields
- Use TextChoices/IntegerChoices for status fields, \`db_index=True\` on filtered/ordered fields
- Create custom QuerySet with chainable filter methods and custom Manager via \`get_queryset()\`
- Use \`select_related()\` for FK/OneToOne, \`prefetch_related()\` for reverse FK/M2M to prevent N+1
- Use \`F()\` for atomic DB-level operations, \`Q()\` for complex AND/OR/NOT logic
- Use \`annotate()\`/\`aggregate()\` for DB-level aggregation (Count, Avg, Sum)
- Use \`bulk_create()\`/\`bulk_update()\` with batch_size for batch operations
- Use \`exists()\` instead of \`len(queryset)\`, \`values()\`/\`values_list()\` for partial fields
- Filter at the database level — never load all objects and filter in Python

For detailed examples and reference, invoke: /django-orm-guide
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

Django security configuration, CSRF protection, XSS prevention, and production settings hardening.

**Key rules:**
- Keep CsrfViewMiddleware, SecurityMiddleware, XFrameOptionsMiddleware, and template auto-escaping active
- Production: \`DEBUG=False\`, \`SECRET_KEY\` from env, explicit \`ALLOWED_HOSTS\`, all cookies Secure+HttpOnly
- Enable HSTS, SSL redirect, content type nosniff, and referrer policy headers
- Split settings into base/local/production/test; use django-environ for env var loading
- Always include \`{% csrf_token %}\` in POST forms; AJAX sends X-CSRFToken header
- Raw SQL must use parameterized queries (\`%s\` placeholders) — never f-strings or string formatting
- Serve user-uploaded content from separate domain; whitelist extensions and enforce max upload size
- Never access settings at module level — use lazy patterns
- Run \`manage.py check --deploy\` before every production deployment

For detailed examples and reference, invoke: /django-security-guide
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
        name: 'django-orm-guide',
        description: 'Detailed reference for Django ORM and QuerySet optimization patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Django ORM & QuerySet Optimization — Detailed Reference

## QuerySet Evaluation and Lazy Loading
QuerySets are lazy — they do not hit the database until evaluated. Evaluation happens when you:
iterate, slice with a step, call \`len()\`, \`list()\`, \`bool()\`, \`repr()\`, or pickle.

\`\`\`python
# This does NOT hit the database — just builds the query
qs = Article.objects.filter(status="published").order_by("-created_at")

# These trigger evaluation:
for article in qs:        # iteration
    print(article.title)
articles = list(qs)       # conversion to list
count = qs.count()        # COUNT query (efficient)
exists = qs.exists()      # EXISTS query (efficient)
\`\`\`

## select_related vs prefetch_related

### select_related — ForeignKey / OneToOne (SQL JOIN)
Use when following a single-valued relationship. Produces one query with a JOIN.

\`\`\`python
# CORRECT: one query with JOIN — no N+1
articles = Article.objects.select_related("author", "category").all()
for article in articles:
    print(article.author.name)      # no extra query
    print(article.category.title)   # no extra query

# ANTI-PATTERN: N+1 queries — one per article for author
articles = Article.objects.all()
for article in articles:
    print(article.author.name)      # extra query each iteration!
\`\`\`

### prefetch_related — Reverse FK / ManyToMany (separate query + Python join)
Use for multi-valued relationships. Produces two queries: one for the main objects, one for related.

\`\`\`python
# CORRECT: two queries total — articles + all related tags
articles = Article.objects.prefetch_related("tags").all()
for article in articles:
    for tag in article.tags.all():  # no extra query
        print(tag.name)

# Advanced: Prefetch with custom queryset
from django.db.models import Prefetch

articles = Article.objects.prefetch_related(
    Prefetch(
        "comments",
        queryset=Comment.objects.filter(is_approved=True).select_related("author"),
        to_attr="approved_comments",
    )
)
for article in articles:
    for comment in article.approved_comments:  # filtered and pre-loaded
        print(comment.author.name)
\`\`\`

## F() Expressions — Database-Level Operations
Use F() to reference field values in the database without loading them into Python.

\`\`\`python
from django.db.models import F

# Atomic increment — no race condition
Article.objects.filter(pk=article_id).update(view_count=F("view_count") + 1)

# Compare two fields in the same row
Article.objects.filter(updated_at__gt=F("published_at"))

# Arithmetic between fields
Product.objects.annotate(profit=F("price") - F("cost"))

# ANTI-PATTERN: loading into Python then saving — race condition
article = Article.objects.get(pk=article_id)
article.view_count += 1   # another request could increment between get and save
article.save()
\`\`\`

## Q() Objects — Complex Queries
Use Q() for OR, AND, NOT combinations that cannot be expressed with keyword arguments.

\`\`\`python
from django.db.models import Q

# OR query
Article.objects.filter(Q(status="published") | Q(author=current_user))

# AND + NOT
Article.objects.filter(
    Q(status="published") & ~Q(category__name="Internal")
)

# Dynamic filter composition
filters = Q()
if search_term:
    filters &= Q(title__icontains=search_term) | Q(body__icontains=search_term)
if category_id:
    filters &= Q(category_id=category_id)
Article.objects.filter(filters)
\`\`\`

## Aggregation — annotate() and aggregate()

\`\`\`python
from django.db.models import Count, Avg, Sum, Max

# aggregate() returns a dict — single row result
stats = Article.objects.aggregate(
    total=Count("id"),
    avg_views=Avg("view_count"),
    total_views=Sum("view_count"),
)
# {'total': 150, 'avg_views': 42.5, 'total_views': 6375}

# annotate() adds a computed column to each row
authors = User.objects.annotate(
    article_count=Count("articles"),
    avg_views=Avg("articles__view_count"),
).filter(article_count__gte=5).order_by("-article_count")

for author in authors:
    print(f"{author.username}: {author.article_count} articles, avg {author.avg_views} views")

# Conditional aggregation
from django.db.models import Case, When, IntegerField

User.objects.annotate(
    published_count=Count(
        Case(When(articles__status="published", then=1), output_field=IntegerField())
    ),
    draft_count=Count(
        Case(When(articles__status="draft", then=1), output_field=IntegerField())
    ),
)
\`\`\`

## Subqueries — Subquery() and OuterRef()

\`\`\`python
from django.db.models import Subquery, OuterRef

# Get the latest comment date for each article
latest_comment = Comment.objects.filter(
    article=OuterRef("pk")
).order_by("-created_at").values("created_at")[:1]

articles = Article.objects.annotate(
    latest_comment_date=Subquery(latest_comment)
)

# Exists subquery — efficient boolean check
from django.db.models import Exists

has_comments = Comment.objects.filter(article=OuterRef("pk"))
articles = Article.objects.annotate(has_comments=Exists(has_comments))
for article in articles:
    if article.has_comments:
        print(f"{article.title} has comments")
\`\`\`

## Bulk Operations — bulk_create / bulk_update

\`\`\`python
# bulk_create — insert many rows in few queries
articles = [
    Article(title=f"Article {i}", author=user, status="draft")
    for i in range(1000)
]
Article.objects.bulk_create(articles, batch_size=250)

# bulk_update — update specific fields in batches
for article in articles:
    article.status = "published"
Article.objects.bulk_update(articles, fields=["status"], batch_size=250)

# ANTI-PATTERN: saving one by one in a loop — 1000 queries
for i in range(1000):
    Article.objects.create(title=f"Article {i}", author=user)
\`\`\`

## Custom Managers and QuerySet Chaining

\`\`\`python
class ArticleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status="published")

    def by_author(self, user):
        return self.filter(author=user)

    def recent(self, days=30):
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff)

    def with_stats(self):
        return self.annotate(
            comment_count=Count("comments"),
            avg_rating=Avg("ratings__score"),
        )


class ArticleManager(models.Manager):
    def get_queryset(self):
        return ArticleQuerySet(self.model, using=self._db)

    def published(self):
        return self.get_queryset().published()


class Article(models.Model):
    # ... fields ...
    objects = ArticleManager()

# Chainable usage:
Article.objects.published().by_author(user).recent(7).with_stats()
\`\`\`

## N+1 Query Detection and Prevention

\`\`\`python
# ANTI-PATTERN: N+1 — one query per iteration for author
articles = Article.objects.all()  # 1 query
for article in articles:
    print(article.author.name)    # N queries (one per article)

# CORRECT: select_related eliminates N+1 for FK
articles = Article.objects.select_related("author").all()  # 1 query with JOIN
for article in articles:
    print(article.author.name)    # no extra query

# ANTI-PATTERN: N+1 on reverse relation / M2M
articles = Article.objects.all()          # 1 query
for article in articles:
    for tag in article.tags.all():        # N queries
        print(tag.name)

# CORRECT: prefetch_related for reverse FK / M2M
articles = Article.objects.prefetch_related("tags").all()  # 2 queries total
for article in articles:
    for tag in article.tags.all():        # no extra query
        print(tag.name)

# Tip: use django-debug-toolbar or django-silk in development
# to see actual query counts per request
\`\`\`

## Raw SQL — Last Resort with Parameterization

\`\`\`python
from django.db import connection

# CORRECT: parameterized query — safe from SQL injection
with connection.cursor() as cursor:
    cursor.execute(
        "SELECT id, title FROM articles WHERE status = %s AND views > %s",
        [status, min_views],
    )
    rows = cursor.fetchall()

# CORRECT: raw() with params on a model
Article.objects.raw(
    "SELECT * FROM articles WHERE MATCH(title, body) AGAINST (%s IN BOOLEAN MODE)",
    [search_term],
)

# ANTI-PATTERN: string formatting — SQL injection vulnerability
cursor.execute(f"SELECT * FROM articles WHERE status = '{status}'")  # NEVER
cursor.execute("SELECT * FROM articles WHERE status = %s" % status)  # NEVER
\`\`\`

## Common Anti-Patterns

\`\`\`python
# ANTI-PATTERN: filtering in Python instead of the database
all_articles = Article.objects.all()
published = [a for a in all_articles if a.status == "published"]  # loads ALL rows

# CORRECT: filter at database level
published = Article.objects.filter(status="published")

# ANTI-PATTERN: len(queryset) loads all rows into memory
total = len(Article.objects.all())  # fetches every row

# CORRECT: use count() for a COUNT query
total = Article.objects.count()

# ANTI-PATTERN: saving in a loop
for article in articles:
    article.status = "archived"
    article.save()  # one UPDATE per article

# CORRECT: single UPDATE query
Article.objects.filter(pk__in=article_ids).update(status="archived")

# ANTI-PATTERN: checking existence by fetching
try:
    article = Article.objects.get(slug=slug)
    exists = True
except Article.DoesNotExist:
    exists = False

# CORRECT: use exists() — no data transfer
exists = Article.objects.filter(slug=slug).exists()
\`\`\`
`,
      },
      {
        name: 'django-security-guide',
        description: 'Detailed reference for Django security hardening and production configuration',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Django Security Hardening — Detailed Reference

## Production Settings Checklist

\`\`\`python
# settings/production.py
import os

DEBUG = False  # NEVER True in production — exposes settings, SQL, stack traces

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]  # NEVER hardcode

ALLOWED_HOSTS = ["www.example.com", "example.com"]  # explicit list, NEVER ["*"]

# HTTPS enforcement
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# HSTS — tell browsers to always use HTTPS
SECURE_HSTS_SECONDS = 31536000       # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookie security
SESSION_COOKIE_SECURE = True          # only send over HTTPS
SESSION_COOKIE_HTTPONLY = True         # no JavaScript access
SESSION_COOKIE_AGE = 1209600          # 2 weeks
CSRF_COOKIE_SECURE = True             # only send over HTTPS
CSRF_COOKIE_HTTPONLY = True            # no JavaScript access

# Content security
SECURE_CONTENT_TYPE_NOSNIFF = True     # prevent MIME-type sniffing
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"              # prevent clickjacking

# Database
CONN_MAX_AGE = 600                    # persistent connections
\`\`\`

### Anti-Pattern: Insecure Production Settings
\`\`\`python
# NEVER do this in production
DEBUG = True                           # exposes everything
SECRET_KEY = "django-insecure-abc123"  # hardcoded and predictable
ALLOWED_HOSTS = ["*"]                  # allows any host header attack
SESSION_COOKIE_SECURE = False          # cookies sent over HTTP
\`\`\`

## CSRF Protection

Django's CsrfViewMiddleware protects against Cross-Site Request Forgery by requiring a token
on all POST/PUT/PATCH/DELETE requests.

### Template Forms
\`\`\`html
<!-- CORRECT: always include csrf_token in POST forms -->
<form method="post" action="{% url 'articles:create' %}">
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">Create</button>
</form>
\`\`\`

### AJAX Requests
\`\`\`python
# In JavaScript — read CSRF token and send as header
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

fetch("/api/articles/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify(data),
});
\`\`\`

### When csrf_exempt is Acceptable
\`\`\`python
from django.views.decorators.csrf import csrf_exempt

# ONLY acceptable for:
# 1. Webhook endpoints from external services (Stripe, GitHub, etc.)
#    — verify via signature instead (e.g., Stripe webhook secret)
# 2. Token-authenticated API endpoints (DRF TokenAuthentication / JWT)
#    — session-based APIs still need CSRF

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)
    # process event...
\`\`\`

## XSS Prevention

### Template Auto-Escaping
Django templates auto-escape HTML by default. This is your primary defense against XSS.

\`\`\`python
# CORRECT: auto-escaped by default — safe
# Template: <p>{{ user_input }}</p>
# If user_input = "<script>alert('xss')</script>"
# Renders as: <p>&lt;script&gt;alert('xss')&lt;/script&gt;</p>

# ANTI-PATTERN: mark_safe on user input — XSS vulnerability
from django.utils.safestring import mark_safe
content = mark_safe(user_comment)  # NEVER on user-generated content

# ANTI-PATTERN: |safe filter on user content in templates
# Template: {{ user_comment|safe }}  — NEVER on untrusted data

# CORRECT: only use mark_safe on content YOU control
from django.utils.html import format_html
safe_link = format_html(
    '<a href="{}">Back to {}</a>',
    url,       # auto-escaped
    page_name, # auto-escaped
)
\`\`\`

### Sanitization for Rich Content
\`\`\`python
# If you MUST allow some HTML (rich text editor output), sanitize it
import bleach

ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h2", "h3"]
ALLOWED_ATTRS = {"a": ["href", "title"]}

def sanitize_html(raw_html):
    return bleach.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,
    )

# Use in the model's save() or serializer validate()
class Article(models.Model):
    body_html = models.TextField()

    def save(self, *args, **kwargs):
        self.body_html = sanitize_html(self.body_html)
        super().save(*args, **kwargs)
\`\`\`

## SQL Injection Prevention

\`\`\`python
# CORRECT: ORM handles parameterization automatically
Article.objects.filter(title__icontains=user_input)

# CORRECT: raw SQL with parameterized placeholders
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute(
        "SELECT * FROM articles WHERE title ILIKE %s",
        [f"%{user_input}%"],
    )

# ANTI-PATTERN: string formatting in SQL — injection vulnerability
cursor.execute(f"SELECT * FROM articles WHERE title = '{user_input}'")
cursor.execute("SELECT * FROM articles WHERE title = '%s'" % user_input)
cursor.execute("SELECT * FROM articles WHERE title = '" + user_input + "'")
\`\`\`

## Authentication Security

\`\`\`python
# settings.py — password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Session security
SESSION_COOKIE_AGE = 1209600          # 2 weeks max
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Login throttling with django-axes
INSTALLED_APPS += ["axes"]
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]
AXES_FAILURE_LIMIT = 5                # lock after 5 failed attempts
AXES_COOLOFF_TIME = 1                 # 1 hour cooloff
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]
\`\`\`

## File Upload Security

\`\`\`python
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError

def validate_file_size(value):
    max_size = 10 * 1024 * 1024  # 10 MB
    if value.size > max_size:
        raise ValidationError(f"File size must not exceed {max_size // (1024*1024)} MB.")

class Document(models.Model):
    file = models.FileField(
        upload_to="documents/%Y/%m/",
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf", "docx", "xlsx", "csv"]),
            validate_file_size,
        ],
    )
    uploaded_by = models.ForeignKey("auth.User", on_delete=models.CASCADE)

    def filename(self):
        return os.path.basename(self.file.name)

# IMPORTANT: serve uploads from a separate domain or CDN
# to prevent same-origin XSS attacks
# e.g., uploads.example.com instead of example.com/media/

# In nginx — restrict upload size at the web server level
# client_max_body_size 10m;
\`\`\`

## Security Headers — SecurityMiddleware and django-csp

\`\`\`python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ... other middleware ...
]

# SecurityMiddleware settings (already covered in production checklist)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True

# Content Security Policy via django-csp
# pip install django-csp
MIDDLEWARE += ["csp.middleware.CSPMiddleware"]

# CSP configuration
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "https://cdn.example.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")  # minimize unsafe-inline
CSP_IMG_SRC = ("'self'", "data:", "https://images.example.com")
CSP_FONT_SRC = ("'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com")
CSP_CONNECT_SRC = ("'self'", "https://api.example.com")
CSP_FRAME_ANCESTORS = ("'none'",)       # prevent framing
CSP_REPORT_URI = "/csp-report/"          # collect violations
\`\`\`

## CORS Configuration — django-cors-headers

\`\`\`python
# pip install django-cors-headers
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # must be before CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    # ...
]

# CORRECT: explicit whitelist
CORS_ALLOWED_ORIGINS = [
    "https://www.example.com",
    "https://app.example.com",
]
CORS_ALLOW_CREDENTIALS = True  # only if cookies/session needed cross-origin

# For development only:
# CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]

# ANTI-PATTERN: allow all origins in production
# CORS_ALLOW_ALL_ORIGINS = True  # NEVER in production — defeats CORS entirely
\`\`\`

## manage.py check --deploy

Run before every production deployment to catch security misconfigurations:

\`\`\`bash
python manage.py check --deploy --settings=config.settings.production

# Common warnings and fixes:
# security.W004 — SECURE_HSTS_SECONDS not set or too low
# security.W008 — SECURE_SSL_REDIRECT not True
# security.W012 — SESSION_COOKIE_SECURE not True
# security.W016 — CSRF_COOKIE_SECURE not True
# security.W018 — DEBUG is True
# security.W019 — X_FRAME_OPTIONS not DENY
# security.W021 — SECURE_HSTS_PRELOAD not True

# Integrate into CI pipeline:
# python manage.py check --deploy --fail-level WARNING
\`\`\`

## Common Security Anti-Patterns

\`\`\`python
# ANTI-PATTERN: hardcoded secret key
SECRET_KEY = "my-secret-key-12345"
# CORRECT:
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

# ANTI-PATTERN: wildcard allowed hosts
ALLOWED_HOSTS = ["*"]
# CORRECT:
ALLOWED_HOSTS = ["www.example.com", "example.com"]

# ANTI-PATTERN: disabling CSRF without alternative protection
@csrf_exempt
def api_view(request):
    # no signature or token verification...
    pass
# CORRECT: use DRF with TokenAuthentication or verify webhook signature

# ANTI-PATTERN: using |safe on user content
# {{ comment.body|safe }}
# CORRECT: sanitize first or use auto-escaping
# {{ comment.body }}

# ANTI-PATTERN: accessing settings at import time
from django.conf import settings
MY_VALUE = settings.SOME_SETTING  # fails if settings not configured yet
# CORRECT: lazy access
def get_my_value():
    from django.conf import settings
    return settings.SOME_SETTING

# ANTI-PATTERN: default admin URL
urlpatterns = [
    path("admin/", admin.site.urls),  # bots scan /admin/ first
]
# CORRECT: obscure admin URL (security through depth, not obscurity alone)
urlpatterns = [
    path("manage-site-8x7k/", admin.site.urls),
]
\`\`\`
`,
      },
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
