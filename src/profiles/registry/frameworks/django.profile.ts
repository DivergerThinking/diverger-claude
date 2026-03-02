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

### Design Philosophies (from Django official docs)
- **DRY**: every distinct piece of data or behavior lives in ONE place — models define everything about an object
- **Loose coupling**: framework layers are independent — templates don't know about views, ORM doesn't know about presentation
- **Explicit is better than implicit**: minimize "magic" — field behavior comes from explicit types and keyword arguments, not naming conventions
- **Batteries included**: use Django's built-in features (auth, admin, forms, ORM, caching, sessions) before reaching for third-party packages

### App Organization
- Organize code into reusable Django apps by domain (users, orders, products, inventory)
- Each app represents a single domain concept — split apps when they grow beyond ~10 models or ~20 views
- Place shared utilities in a \`common\` or \`core\` app
- Use \`apps.py\` to configure app metadata and \`ready()\` for startup logic (signal connections)

### Models
- Models follow the Active Record pattern — include all domain logic, \`__str__\`, ordering, constraints
- Define fields with explicit types, constraints, and validators — never rely on implicit behavior from field names
- Use class-based views (CBVs) for standard CRUD patterns; function-based views (FBVs) for non-standard logic
- Use Django REST Framework serializers and viewsets for API endpoints

### Settings
- Split settings into modules: \`base.py\` (shared), \`local.py\` (development), \`production.py\`, \`test.py\`
- Use \`django-environ\` or \`python-decouple\` for environment variable parsing
- Never access \`django.conf.settings\` at module level — use lazy evaluation to prevent premature configuration

### Coding Style (from Django official coding style guide)
- Format with \`black\` (88-char line limit for code, 79 for docstrings)
- Sort imports with \`isort\`: \`__future__\` -> stdlib -> third-party -> Django -> local (one-dot relative)
- Use \`snake_case\` for variables, functions, fields; \`InitialCaps\` for classes
- Template spacing: \`{{ variable }}\`, \`{% tag %}\` — one space between braces and content
- First parameter of every view function is \`request\` — never abbreviate to \`req\`
- Use enumeration types (\`TextChoices\`, \`IntegerChoices\`) for model field choices`,
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
        governance: 'mandatory',
        description: 'Django model design, ORM patterns, and query optimization',
        content: `# Django Models & ORM

## Why This Matters
Django's ORM is the backbone of data access. Models follow the Active Record pattern — they encapsulate
every aspect of an "object" including data, behavior, human-readable names, and constraints.
Poorly designed models and queries are the #1 cause of Django performance issues.

---

## Model Design

### Class Organization (official Django style)
Order members inside a model class as follows:
1. Database fields
2. Custom manager attributes
3. \`class Meta\` (with blank line before it)
4. \`def __str__()\` and other magic methods
5. \`def save()\`, \`def delete()\`
6. \`def get_absolute_url()\`
7. Custom methods

### Correct
\`\`\`python
from django.db import models
from django.urls import reverse


class Article(models.Model):
    # 1. Database fields
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    body = models.TextField()
    author = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="articles",
    )
    category = models.ForeignKey(
        "Category",
        on_delete=models.PROTECT,
        related_name="articles",
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    status = models.CharField(
        max_length=10,
        choices=Status,
        default=Status.DRAFT,
        db_index=True,
    )

    # 2. Custom manager
    objects = models.Manager()
    published = PublishedManager()

    # 3. Meta
    class Meta:
        ordering = ["-published_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug", "author"],
                name="unique_author_slug",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
        ]
        verbose_name = "article"
        verbose_name_plural = "articles"

    # 4. __str__ and magic methods
    def __str__(self) -> str:
        return self.title

    # 5. save/delete overrides
    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    # 6. get_absolute_url
    def get_absolute_url(self) -> str:
        return reverse("articles:detail", kwargs={"slug": self.slug})

    # 7. Custom methods
    def publish(self) -> None:
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])

    @property
    def is_published(self) -> bool:
        return self.status == self.Status.PUBLISHED
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: missing on_delete, no constraints, no __str__, no Meta, magic strings
class Article(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey("auth.User")  # Missing on_delete!
    status = models.CharField(max_length=10, default="draft")  # Magic string!
    cat = models.IntegerField()  # Abbreviation, no ForeignKey, int for a relation
    # No __str__, no Meta, no ordering, no indexes
\`\`\`

---

## Custom Managers and QuerySets

### Correct
\`\`\`python
class ArticleQuerySet(models.QuerySet):
    def published(self) -> "ArticleQuerySet":
        return self.filter(status=Article.Status.PUBLISHED)

    def by_author(self, user: "User") -> "ArticleQuerySet":
        return self.filter(author=user)

    def recent(self, days: int = 30) -> "ArticleQuerySet":
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(published_at__gte=cutoff)


class PublishedManager(models.Manager):
    def get_queryset(self) -> ArticleQuerySet:
        return ArticleQuerySet(self.model, using=self._db).published()


# Usage — chainable and expressive
articles = (
    Article.objects
    .published()
    .by_author(request.user)
    .recent(days=7)
    .select_related("author", "category")
)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: utility functions instead of managers, repeated filter logic everywhere
def get_published_articles(user):
    return Article.objects.filter(
        status="published", author=user,
        published_at__gte=timezone.now() - timedelta(days=30),
    )
# Scattered across views, not chainable, duplicates filter logic
\`\`\`

---

## ORM Query Optimization

### Preventing N+1 Queries

\`\`\`python
# BAD: N+1 — one query per article's author
for article in Article.objects.all():
    print(article.author.name)  # Hits the database on every iteration

# GOOD: select_related for ForeignKey / OneToOne (SQL JOIN)
for article in Article.objects.select_related("author", "category"):
    print(article.author.name)  # No extra query — joined in a single SQL

# GOOD: prefetch_related for reverse FK / ManyToMany (separate query + Python join)
for author in User.objects.prefetch_related("articles"):
    print(list(author.articles.all()))  # No extra query per author
\`\`\`

### F Expressions and Q Objects

\`\`\`python
from django.db.models import F, Q, Count, Avg

# F() — database-level field operations (no Python round-trip)
Article.objects.filter(comments_count__gt=F("views_count") / 10)
Article.objects.update(views_count=F("views_count") + 1)  # Atomic increment

# Q() — complex AND/OR/NOT logic
Article.objects.filter(
    Q(status="published") & (Q(title__icontains="django") | Q(body__icontains="django")),
    ~Q(author__is_staff=True),
)

# Annotations and aggregations
Author.objects.annotate(
    article_count=Count("articles"),
    avg_views=Avg("articles__views_count"),
).filter(article_count__gte=5).order_by("-avg_views")
\`\`\`

### Bulk Operations

\`\`\`python
# bulk_create — single INSERT for many rows
Article.objects.bulk_create([
    Article(title=f"Article {i}", author=user)
    for i in range(100)
], batch_size=50)

# bulk_update — single UPDATE for many rows
articles = Article.objects.filter(status="draft")
for article in articles:
    article.status = "archived"
Article.objects.bulk_update(articles, ["status"], batch_size=50)

# Efficient existence check
if Article.objects.filter(slug=slug).exists():
    ...

# Use values() / values_list() when you only need specific fields
emails = User.objects.values_list("email", flat=True)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: loading all objects to count them
count = len(Article.objects.all())  # Fetches ALL rows into memory!
count = Article.objects.count()     # Good: SELECT COUNT(*) at DB level

# Bad: Python-level filtering after fetching everything
all_articles = list(Article.objects.all())
published = [a for a in all_articles if a.status == "published"]
# Good: filter at the database level
published = Article.objects.filter(status="published")
\`\`\`
`,
      },
      {
        path: 'django/views-urls-forms.md',
        governance: 'mandatory',
        description: 'Django views, URL configuration, forms, and request handling',
        content: `# Django Views, URLs & Forms

## Why This Matters
Views are the bridge between HTTP and your domain logic. Django's design philosophy
demands thin views, clean URL design, and explicit GET/POST differentiation.
The template system deliberately avoids becoming a programming language.

---

## Views

### Function-Based Views (FBVs)
Use for non-standard logic, custom workflows, or simple endpoints.

\`\`\`python
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods


@login_required
@require_http_methods(["GET", "POST"])
def create_article(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = ArticleForm(request.POST)
        if form.is_valid():
            article = form.save(commit=False)
            article.author = request.user
            article.save()
            return redirect(article.get_absolute_url())
    else:
        form = ArticleForm()

    return render(request, "articles/create.html", {"form": form})
\`\`\`

### Class-Based Views (CBVs)
Use for standard CRUD patterns where Django provides a ready-made view.

\`\`\`python
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView


class ArticleListView(ListView):
    model = Article
    template_name = "articles/list.html"
    context_object_name = "articles"
    paginate_by = 20

    def get_queryset(self):
        return (
            Article.published
            .select_related("author", "category")
            .only("title", "slug", "author__username", "published_at")
        )


class ArticleDetailView(DetailView):
    model = Article
    template_name = "articles/detail.html"
    slug_field = "slug"

    def get_queryset(self):
        return Article.objects.select_related("author", "category")


class ArticleCreateView(LoginRequiredMixin, CreateView):
    model = Article
    form_class = ArticleForm
    template_name = "articles/form.html"

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: business logic in view, no get_object_or_404, bare try/except
def article_detail(request, id):
    try:
        article = Article.objects.filter(id=id)[0]  # No 404 handling
    except IndexError:
        return HttpResponse("Not found")  # Returns 200, not 404!

    # Business logic belongs in model or service, not the view
    if article.views > 100:
        article.is_trending = True
        article.save()

    return render(request, "detail.html", {"a": article})  # Cryptic context name
\`\`\`

---

## URL Configuration

Django's URL philosophy: loose coupling (URLs not tied to function names), infinite flexibility,
and clean/pretty URLs encouraged.

### Correct
\`\`\`python
# articles/urls.py
from django.urls import path

from . import views

app_name = "articles"  # Namespace for {% url %} and reverse()

urlpatterns = [
    path("", views.ArticleListView.as_view(), name="list"),
    path("create/", views.ArticleCreateView.as_view(), name="create"),
    path("<slug:slug>/", views.ArticleDetailView.as_view(), name="detail"),
    path("<slug:slug>/edit/", views.ArticleUpdateView.as_view(), name="update"),
]

# project/urls.py
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("articles/", include("articles.urls")),
    path("api/v1/", include("api.urls")),
]
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: no app_name, no namespacing, regex where path suffices, hardcoded IDs
urlpatterns = [
    path("getArticle/", views.get_article),  # Verb in URL, no slug/id
    re_path(r"^article/(?P<id>[0-9]+)/$", views.detail),  # Use path() converters instead
]
\`\`\`

---

## Forms and Validation

### Correct
\`\`\`python
from django import forms
from django.core.exceptions import ValidationError


class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ["title", "body", "category", "status"]
        widgets = {
            "body": forms.Textarea(attrs={"rows": 10}),
        }

    def clean_title(self) -> str:
        title = self.cleaned_data["title"]
        if Article.objects.filter(title__iexact=title).exclude(pk=self.instance.pk).exists():
            raise ValidationError("An article with this title already exists.")
        return title

    def clean(self) -> dict:
        cleaned_data = super().clean()
        status = cleaned_data.get("status")
        body = cleaned_data.get("body")
        if status == Article.Status.PUBLISHED and not body:
            raise ValidationError("Published articles must have a body.")
        return cleaned_data
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: manual field definition duplicating model, no validation
class ArticleForm(forms.Form):
    title = forms.CharField()
    body = forms.CharField()

    # Validates nothing, trusts input blindly
\`\`\`

---

## Templates

### Rules (from Django coding style guide)
- \`{% extends %}\` must be the first non-comment line in a template
- Use template inheritance: \`base.html\` -> \`section.html\` -> \`page.html\`
- Use \`{% url 'namespace:name' %}\` for URL generation — never hardcode URLs
- Use \`{% csrf_token %}\` in every POST form
- Keep logic out of templates — use custom template tags and filters for formatting
- Spacing: \`{{ variable }}\`, \`{% tag %}\` — one space between braces and content
- No spaces around \`.\` and \`|\`: \`{{ user.name|lower }}\`
- Include block name in \`{% endblock content %}\` for readability

### Correct
\`\`\`html
{% extends "base.html" %}
{% load humanize %}

{% block title %}{{ article.title }}{% endblock title %}

{% block content %}
<article>
  <h1>{{ article.title }}</h1>
  <p>By {{ article.author.get_full_name }} | {{ article.published_at|naturaltime }}</p>
  {{ article.body|linebreaks }}
</article>

<form method="post" action="{% url 'articles:comment' article.slug %}">
  {% csrf_token %}
  {{ comment_form.as_div }}
  <button type="submit">Add Comment</button>
</form>
{% endblock content %}
\`\`\`
`,
      },
      {
        path: 'django/security-and-settings.md',
        governance: 'mandatory',
        description: 'Django security configuration, CSRF, XSS, and settings management',
        content: `# Django Security & Settings

## Why This Matters
Django provides robust built-in security protections (CSRF, XSS, SQL injection, clickjacking,
session security). But these protections only work when properly configured. Misconfiguration
is the #1 cause of Django security vulnerabilities.

---

## Security Checklist

### Built-in Protections — Keep Them Active
- \`CsrfViewMiddleware\` — NEVER remove from MIDDLEWARE; use \`csrf_exempt\` sparingly
- \`SecurityMiddleware\` — enables HSTS, SSL redirect, and security headers
- \`XFrameOptionsMiddleware\` — prevents clickjacking via X-Frame-Options
- Template auto-escaping — NEVER disable unless you have sanitized the content

### Production Settings

\`\`\`python
# settings/production.py

# Security
DEBUG = False
SECRET_KEY = env("DJANGO_SECRET_KEY")  # NEVER hardcode
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")  # Explicit whitelist

# HTTPS
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # If behind proxy
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookies
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Content Security
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# Database
CONN_MAX_AGE = 600  # Persistent connections
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: production misconfigurations
DEBUG = True  # NEVER in production — exposes settings, SQL, stack traces
SECRET_KEY = "django-insecure-hardcoded-key"  # Predictable, in source control!
ALLOWED_HOSTS = ["*"]  # Accepts any host — cache poisoning, CSRF bypass
SESSION_COOKIE_SECURE = False  # Cookies sent over HTTP — session hijacking
\`\`\`

---

## Settings Organization

### Correct Structure
\`\`\`
config/
  __init__.py
  settings/
    __init__.py
    base.py           # Shared: INSTALLED_APPS, MIDDLEWARE, templates, auth backends
    local.py          # Development: DEBUG=True, console email, django-debug-toolbar
    production.py     # Production: security hardening, real email, caching, logging
    test.py           # Testing: fast password hasher, in-memory cache, test DB
  urls.py
  wsgi.py
  asgi.py
\`\`\`

### Correct — base.py structure
\`\`\`python
# config/settings/base.py
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env()

# Read .env file if it exists (development only)
env.read_env(BASE_DIR / ".env", overrides=False)

SECRET_KEY = env("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "django_filters",
    "corsheaders",
    # Local apps
    "apps.users",
    "apps.articles",
]

DATABASES = {
    "default": env.db("DATABASE_URL", default="sqlite:///db.sqlite3"),
}

# Never access settings at module level in other modules — use lazy patterns
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: single settings.py with if/else for environments
DEBUG = os.environ.get("DEBUG", "True") == "True"  # String comparison, default True!
SECRET_KEY = "my-super-secret"  # Hardcoded
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mydb",
        "PASSWORD": "mypassword",  # Password in source code!
    }
}
\`\`\`

---

## Django-Specific Security Patterns

### CSRF Protection
\`\`\`python
# Templates — ALWAYS include in forms
<form method="post">
    {% csrf_token %}
    {{ form.as_div }}
    <button type="submit">Submit</button>
</form>

# AJAX with fetch — read token from cookie
const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]").value;
fetch("/api/endpoint/", {
    method: "POST",
    headers: {"X-CSRFToken": csrftoken},
    body: JSON.stringify(data),
});

# DRF uses SessionAuthentication which enforces CSRF by default
# For token-based APIs: CSRF is not needed (use TokenAuthentication or JWT)
\`\`\`

### Raw SQL — When It's Unavoidable
\`\`\`python
# GOOD: parameterized query — safe from SQL injection
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT * FROM articles WHERE status = %s AND author_id = %s",
        [status, author_id],
    )
    rows = cursor.fetchall()

# BAD: string formatting in SQL — SQL injection!
cursor.execute(f"SELECT * FROM articles WHERE status = '{status}'")  # NEVER!
\`\`\`

### User-Uploaded Content Security
- Serve uploads from a separate domain (not subdomain) to prevent same-origin XSS
- Whitelist allowed file extensions and MIME types
- Configure max upload size at the web server level (Nginx \`client_max_body_size\`)
- Never serve uploaded files with code execution enabled
- Use \`FileExtensionValidator\` and custom validators on \`FileField\` / \`ImageField\`
`,
      },
      {
        path: 'django/admin-drf-deployment.md',
        governance: 'recommended',
        description: 'Django admin, DRF patterns, signals, and deployment',
        content: `# Django Admin, REST Framework & Deployment

## Admin Configuration

### Correct
\`\`\`python
from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "status", "published_at", "views_count"]
    list_filter = ["status", "category", "published_at"]
    search_fields = ["title", "body", "author__username"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["created_at", "updated_at", "views_count"]
    date_hierarchy = "published_at"
    raw_id_fields = ["author"]  # Avoids loading all users in a dropdown
    list_per_page = 50

    fieldsets = (
        (None, {
            "fields": ("title", "slug", "body", "category"),
        }),
        ("Publishing", {
            "fields": ("status", "published_at", "author"),
        }),
        ("Metadata", {
            "classes": ("collapse",),
            "fields": ("created_at", "updated_at", "views_count"),
        }),
    )

    actions = ["publish_selected", "archive_selected"]

    @admin.action(description="Publish selected articles")
    def publish_selected(self, request, queryset):
        updated = queryset.update(
            status=Article.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        self.message_user(request, f"{updated} article(s) published.")
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: bare registration, no customization, useless in practice
admin.site.register(Article)
\`\`\`

---

## Django REST Framework Patterns

### Serializers
\`\`\`python
from rest_framework import serializers


class ArticleListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "slug", "author_name", "status", "published_at"]
        read_only_fields = ["id", "slug", "published_at"]


class ArticleDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "slug", "body", "author", "category", "status", "published_at"]
        read_only_fields = ["id", "slug", "author", "published_at"]

    def validate_title(self, value: str) -> str:
        if Article.objects.filter(title__iexact=value).exclude(pk=self.instance and self.instance.pk).exists():
            raise serializers.ValidationError("Article with this title already exists.")
        return value
\`\`\`

### ViewSets
\`\`\`python
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend


class ArticleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category"]
    search_fields = ["title", "body"]
    ordering_fields = ["published_at", "views_count"]
    ordering = ["-published_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        return ArticleDetailSerializer

    def get_queryset(self):
        return (
            Article.objects
            .select_related("author", "category")
            .only("id", "title", "slug", "status", "published_at",
                  "author__username", "author__first_name", "author__last_name")
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def publish(self, request, pk=None):
        article = self.get_object()
        article.publish()
        return Response(ArticleDetailSerializer(article).data)
\`\`\`

---

## Signals — Use Sparingly

### When to Use Signals
- Truly decoupled cross-app communication (e.g., audit logging, cache invalidation)
- Responding to third-party app events where you cannot modify the source

### When NOT to Use Signals
- Within the same app — prefer explicit method calls or \`save()\` overrides
- For complex workflows — signals create hidden execution paths that are hard to debug

### Correct
\`\`\`python
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Article, dispatch_uid="article_index_update")
def update_search_index(sender, instance, created, **kwargs):
    """Update search index when article is saved. Cross-app concern."""
    from search.tasks import reindex_article
    reindex_article.delay(instance.pk)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: signal for same-app logic, no dispatch_uid, complex logic
@receiver(post_save, sender=Article)  # No dispatch_uid — may connect twice
def on_article_save(sender, instance, **kwargs):
    # Same-app logic that should be in Article.save() or Article.publish()
    if instance.status == "published":
        instance.author.article_count += 1
        instance.author.save()
        send_notification(instance)
\`\`\`

---

## Migrations

### Rules
- Run \`makemigrations\` after every model change — commit migration files to version control
- Review auto-generated migrations before applying — check for unintended changes
- Never edit migrations that have been applied to production — create new migrations
- Write both forward and reverse operations for data migrations
- Use \`RunPython\` with both \`code\` and \`reverse_code\` parameters
- For large tables: use \`AddIndex\` with \`CREATE INDEX CONCURRENTLY\` on PostgreSQL

### Data Migration
\`\`\`python
from django.db import migrations


def populate_slugs(apps, schema_editor):
    Article = apps.get_model("articles", "Article")
    for article in Article.objects.filter(slug=""):
        article.slug = slugify(article.title)
        article.save(update_fields=["slug"])


def reverse_populate_slugs(apps, schema_editor):
    pass  # Slug removal is non-destructive, safe to skip


class Migration(migrations.Migration):
    dependencies = [("articles", "0003_article_slug")]

    operations = [
        migrations.RunPython(populate_slugs, reverse_populate_slugs),
    ]
\`\`\`

---

## Deployment

### Production Checklist
\`\`\`bash
# Always run before deploying
python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput
\`\`\`

- Use Gunicorn or uWSGI as the WSGI server — never \`manage.py runserver\` in production
- Use \`daphne\` or \`uvicorn\` for ASGI (if using async views, WebSockets, or Channels)
- Serve static files with Nginx or a CDN — not with Django's \`django.contrib.staticfiles\`
- Run behind a reverse proxy (Nginx, Caddy) for TLS termination, rate limiting, and static files
- Use a non-root user in Docker containers
- Run \`manage.py check --deploy\` to verify security settings
- Configure structured logging (JSON) for observability
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
- [ ] Admin site URL is not the default \`/admin/\` in production (optional but recommended)`,
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
- [ ] CORS properly configured via django-cors-headers — no \`CORS_ALLOW_ALL_ORIGINS = True\` in production`,
      },
    ],
    skills: [
      {
        name: 'django-model-generator',
        description: 'Generate Django models with full admin, serializer, and migration setup',
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
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/raw\\s*\\(|connection\\.cursor|execute\\s*\\(/.test(c) && !/migration|test/.test(f.toLowerCase())) {
  if (/f['\"]|%s.*%[^s]|\\.format\\(/.test(c) && /execute/.test(c)) {
    console.log('HOOK_EXIT:1:Raw SQL with string formatting detected — use parameterized queries with %s placeholders');
  } else {
    console.log('Warning: Raw SQL detected — prefer Django ORM (QuerySet, F expressions, Q objects) unless the query is impossible with the ORM');
  }
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/models\\.ForeignKey/.test(c) && !/on_delete/.test(c)) {
  console.log('HOOK_EXIT:1:ForeignKey without on_delete detected — always specify on_delete (CASCADE, PROTECT, SET_NULL)');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
const f = process.argv[1] || '';
if (!/settings.*\\.py$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/DEBUG\\s*=\\s*True/.test(c) && /production|prod/.test(f.toLowerCase())) {
  console.log('HOOK_EXIT:1:DEBUG = True in production settings — this exposes sensitive information');
}
if (/SECRET_KEY\\s*=\\s*['\"][^'\"]*['\"]/.test(c) && !/env\\(|environ|decouple|os\\.getenv/.test(c)) {
  console.log('Warning: SECRET_KEY appears hardcoded — use environment variable via django-environ or os.getenv');
}
if (/ALLOWED_HOSTS\\s*=\\s*\\[\\s*['\"]\\*['\"]/.test(c)) {
  console.log('Warning: ALLOWED_HOSTS = [\"*\"] allows any host header — use explicit hostnames in production');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
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
  console.log('Warning: QuerySet iteration without select_related/prefetch_related at line(s) ' + noPrefetch.join(', ') + ' — potential N+1 query');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
