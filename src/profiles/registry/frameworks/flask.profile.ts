import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const flaskProfile: Profile = {
  id: 'frameworks/flask',
  name: 'Flask',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['flask'],
  contributions: {
    claudeMd: [
      {
        heading: 'Flask Conventions',
        order: 20,
        content: `## Flask Conventions

Micro-framework with explicit setup. Application factory pattern, Blueprints for modularity.

**Detailed rules:** see \`.claude/rules/flask/\` directory.

**Key rules:**
- Application factory (\`create_app()\`) with config from environment, not hardcoded
- Blueprints for feature grouping, one per domain area
- Request validation at the boundary (marshmallow, pydantic, or WTForms)
- Error handlers registered on app, return JSON for APIs, HTML for web`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
          'Bash(flask:*)',
          'Bash(pytest:*)',
          'Bash(gunicorn:*)',
          'Bash(celery:*)',
          'Bash(flask-migrate:*)',
          'Bash(alembic:*)',
        ],
      },
    },
    rules: [
      {
        path: 'flask/architecture.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'mandatory',
        description: 'Flask application factory, Blueprints, and project structure',
        content: `# Flask Architecture

## Why This Matters
Flask's micro-framework philosophy means architecture decisions are yours. The application
factory pattern and Blueprints are the official recommendations from Flask's documentation
for any non-trivial application. Ignoring them leads to circular imports, untestable code,
and monolithic files that grow uncontrollably.

---

## Application Factory

The factory pattern is the canonical way to create Flask applications. Extensions are
instantiated at module level (without an app) and bound inside the factory with \`init_app()\`.

### Correct
\`\`\`python
# app/extensions.py — extensions instantiated without app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_caching import Cache

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache()
\`\`\`

\`\`\`python
# app/__init__.py — the factory
from flask import Flask
from app.extensions import db, migrate, login_manager, cache

def create_app(config_class: str = "config.ProductionConfig") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config.from_prefixed_env()  # FLASK_ env overrides

    # Bind extensions inside factory
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cache.init_app(app)

    # Register Blueprints
    from app.views.auth import auth_bp
    from app.views.api import api_bp
    from app.views.main import main_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    # Register error handlers
    from app.errors import register_error_handlers
    register_error_handlers(app)

    # Register CLI commands
    from app.cli import register_cli_commands
    register_cli_commands(app)

    return app
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: global app object — prevents testing with different configs,
# causes circular imports, blocks running multiple instances
from flask import Flask
app = Flask(__name__)
db = SQLAlchemy(app)  # extension bound at import time

from app.views import *  # circular import risk, wildcard import
\`\`\`

---

## Configuration Classes

Use class-based config with inheritance. Load secrets from environment variables, never
hardcode them.

### Correct
\`\`\`python
# config.py
import os

class BaseConfig:
    SECRET_KEY = os.environ["SECRET_KEY"]
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///dev.db"
    )

class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SERVER_NAME = "localhost"

class ProductionConfig(BaseConfig):
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Strict"
    SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]
    PREFERRED_URL_SCHEME = "https"
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: secrets hardcoded, no environment separation
app.config["SECRET_KEY"] = "super-secret-key-123"
app.config["DATABASE_URL"] = "postgresql://admin:password@localhost/prod"
\`\`\`

---

## Project Structure

\`\`\`
project/
  pyproject.toml
  config.py                 # Configuration classes
  wsgi.py                   # WSGI entry point: app = create_app()
  app/
    __init__.py             # Application factory (create_app)
    extensions.py           # Extension instances (db, migrate, login_manager)
    errors.py               # Global error handlers
    cli.py                  # Custom flask CLI commands
    models/
      __init__.py
      user.py               # SQLAlchemy models
      post.py
    views/
      __init__.py
      auth.py               # auth_bp Blueprint
      api.py                # api_bp Blueprint
      main.py               # main_bp Blueprint
    services/
      __init__.py
      user_service.py       # Business logic (framework-agnostic)
      email_service.py
    schemas/
      __init__.py
      user_schema.py        # Marshmallow/Pydantic schemas for serialization
    templates/
      base.html             # Jinja2 base template with template inheritance
      auth/
        login.html
      main/
        index.html
    static/
      css/
      js/
  migrations/               # Flask-Migrate (Alembic) migration scripts
  tests/
    conftest.py             # Shared pytest fixtures (app, client, db)
    unit/
    integration/
\`\`\`

---

## Blueprints

Each Blueprint encapsulates a feature domain. Keep Blueprints self-contained: own
templates subdirectory, own error handlers, own \`before_request\` hooks.

### Correct
\`\`\`python
# app/views/auth.py
from flask import Blueprint, request, jsonify, g
from app.services.user_service import UserService

auth_bp = Blueprint("auth", __name__, template_folder="templates")

@auth_bp.before_request
def load_current_user() -> None:
    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    g.current_user = UserService.verify_token(token) if token else None

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=False, silent=True)
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "email and password required"}), 400

    user = UserService.authenticate(data["email"], data["password"])
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    token = UserService.generate_token(user)
    return jsonify({"token": token, "user_id": user.id}), 200

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Authentication required"}), 401
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: monolithic routes file, no Blueprint, logic mixed with routing
@app.route("/login", methods=["POST"])
def login():
    email = request.form["email"]      # no validation, KeyError on missing field
    user = User.query.filter_by(email=email).first()
    # ... business logic directly in route handler
    # ... database queries mixed with HTTP handling
\`\`\`

---

## Extension Initialization Pattern

### Correct: Deferred Binding
\`\`\`python
# extensions.py
db = SQLAlchemy()  # no app yet

# __init__.py (inside create_app)
db.init_app(app)   # bind to this specific app instance
\`\`\`

### Why It Matters
- Allows one extension to serve multiple app instances (testing, multi-tenant)
- Avoids circular imports (extensions don't import app, app imports extensions)
- Matches Flask's documentation recommendation exactly

---

## Database Patterns

- Use Flask-SQLAlchemy's \`db.session\` which is scoped per-request automatically
- Use Flask-Migrate for all schema changes — never modify production DB manually
- Define relationships with explicit \`back_populates\` (not implicit \`backref\`)
- Keep models thin — business logic belongs in services, not in model methods

### Correct
\`\`\`python
# app/models/user.py
from app.extensions import db
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    posts = db.relationship("Post", back_populates="author", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
\`\`\`
`,
      },
      {
        path: 'flask/security.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'mandatory',
        description: 'Flask security: CSRF, sessions, secrets, and deployment hardening',
        content: `# Flask Security Best Practices

## Why This Matters
Flask gives you freedom — including the freedom to introduce security flaws. Unlike
full-stack frameworks (Django), Flask does not enable CSRF protection, secure session
cookies, or authentication out of the box. You must configure them explicitly.

---

## CSRF Protection

### For Server-Rendered Forms
\`\`\`python
# Use Flask-WTF for automatic CSRF protection
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email

class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
\`\`\`

\`\`\`html
<!-- In Jinja2 template: include hidden CSRF token -->
<form method="post">
    {{ form.hidden_tag() }}
    {{ form.email.label }} {{ form.email() }}
    {{ form.password.label }} {{ form.password() }}
    <button type="submit">Login</button>
</form>
\`\`\`

### For JSON APIs
- Use token-based authentication (JWT, API keys) instead of session CSRF
- If using sessions for API auth, send CSRF token via custom header (\`X-CSRFToken\`)
- Validate \`Origin\` and \`Referer\` headers as additional defense

---

## Session Security

### Correct: Production Session Configuration
\`\`\`python
class ProductionConfig:
    SECRET_KEY = os.environ["SECRET_KEY"]         # strong, random, from env
    SESSION_COOKIE_SECURE = True                  # HTTPS only
    SESSION_COOKIE_HTTPONLY = True                 # no JavaScript access
    SESSION_COOKIE_SAMESITE = "Lax"               # CSRF protection
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    SESSION_REFRESH_EACH_REQUEST = True
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: weak secret, insecure defaults
app.secret_key = "dev"                            # predictable, in source code
# Missing SESSION_COOKIE_SECURE — cookies sent over HTTP
# Missing SESSION_COOKIE_HTTPONLY — XSS can steal session
\`\`\`

### Server-Side Sessions
- Flask's default sessions are signed cookies (client-side) — the user can read (not tamper) the data
- For sensitive session data, use Flask-Session with Redis or database backend
- Never store PII, tokens, or secrets directly in client-side session cookies

---

## Input Validation

### Correct: Validate Before Use
\`\`\`python
from marshmallow import Schema, fields, validate, ValidationError

class CreateUserSchema(Schema):
    email = fields.Email(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    age = fields.Integer(validate=validate.Range(min=0, max=150))

@api_bp.route("/users", methods=["POST"])
def create_user():
    schema = CreateUserSchema()
    try:
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    user = UserService.create(data)
    return jsonify(UserResponseSchema().dump(user)), 201
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: trusting raw request data without validation
@app.route("/users", methods=["POST"])
def create_user():
    data = request.json               # could be None, could be malformed
    user = User(
        name=data["name"],            # KeyError if missing
        email=data["email"],          # no format validation
    )
    db.session.add(user)
    db.session.commit()               # SQL error on constraint violation = 500
\`\`\`

---

## Blueprint-Level Security

\`\`\`python
# Isolate admin routes with strict auth
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

@admin_bp.before_request
def require_admin():
    if not g.get("current_user") or not g.current_user.is_admin:
        abort(403)

# Rate-limit authentication Blueprint independently
from flask_limiter import Limiter
limiter = Limiter(key_func=get_remote_address)

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    ...
\`\`\`

---

## Deployment Hardening

### ProxyFix for Reverse Proxy
\`\`\`python
# wsgi.py — when behind nginx/Apache
from werkzeug.middleware.proxy_fix import ProxyFix
from app import create_app

app = create_app()
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
\`\`\`

### Production Checklist
- [ ] \`FLASK_DEBUG=0\` and \`TESTING=False\`
- [ ] Strong \`SECRET_KEY\` from environment (>= 32 random bytes)
- [ ] \`SESSION_COOKIE_SECURE=True\` (requires HTTPS)
- [ ] WSGI server (Gunicorn/uWSGI/Waitress) — NOT \`flask run\`
- [ ] Reverse proxy (nginx/Apache) in front of WSGI server
- [ ] \`ProxyFix\` configured to match proxy headers
- [ ] CORS restricted to specific origins — never \`*\` in production
- [ ] Security headers set (CSP, HSTS, X-Content-Type-Options)
- [ ] Static files served by reverse proxy, not Flask
`,
      },
      {
        path: 'flask/patterns.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'recommended',
        description: 'Flask patterns: view decorators, Celery background tasks, streaming, error handling',
        content: `# Flask Patterns

## Why This Matters
Flask's "Patterns for Flask" documentation provides battle-tested solutions to common
problems. These patterns have evolved over a decade of community use and form the
de facto standard for Flask applications.

---

## View Decorators

Use \`functools.wraps\` to preserve function metadata. Stack decorators with \`@route\`
outermost.

### Login Required
\`\`\`python
from functools import wraps
from flask import g, request, redirect, url_for, abort

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if g.get("current_user") is None:
            if request.is_json:
                abort(401)
            return redirect(url_for("auth.login", next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@main_bp.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")
\`\`\`

### Role Required
\`\`\`python
def role_required(role: str):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not g.get("current_user") or role not in g.current_user.roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@admin_bp.route("/settings")
@login_required
@role_required("admin")
def admin_settings():
    ...
\`\`\`

### Caching Decorator
\`\`\`python
def cached(timeout: int = 300, key_prefix: str = "view"):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = f"{key_prefix}/{request.path}"
            rv = cache.get(cache_key)
            if rv is not None:
                return rv
            rv = f(*args, **kwargs)
            cache.set(cache_key, rv, timeout=timeout)
            return rv
        return decorated_function
    return decorator
\`\`\`

---

## Background Tasks with Celery

### Integration with Application Factory
\`\`\`python
# app/celery_init.py
from celery import Celery, Task
from flask import Flask

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
\`\`\`

### Defining Tasks
\`\`\`python
# app/tasks.py — use @shared_task, not @celery_app.task
from celery import shared_task

@shared_task(ignore_result=False)
def send_welcome_email(user_id: int) -> bool:
    """Tasks receive simple, serializable args — not ORM objects."""
    from app.models.user import User
    from app.extensions import db

    user = db.session.get(User, user_id)
    if not user:
        return False
    # ... send email ...
    return True
\`\`\`

### Calling Tasks from Views
\`\`\`python
@auth_bp.route("/register", methods=["POST"])
def register():
    user = UserService.create(validated_data)
    send_welcome_email.delay(user.id)  # fire-and-forget, returns immediately
    return jsonify({"user_id": user.id}), 201
\`\`\`

---

## Consistent Error Responses

### Centralized Error Handlers
\`\`\`python
# app/errors.py
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

def register_error_handlers(app: Flask) -> None:

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        if request.is_json or request.path.startswith("/api"):
            return jsonify({
                "error": error.name,
                "message": error.description,
                "status": error.code,
            }), error.code
        return error.get_response()

    @app.errorhandler(422)
    def handle_validation_error(error):
        return jsonify({
            "error": "Validation Error",
            "message": "Invalid input data",
            "details": getattr(error, "description", {}),
        }), 422

    @app.errorhandler(500)
    def handle_internal_error(error):
        app.logger.error("Internal error: %s", error, exc_info=True)
        return jsonify({
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
        }), 500
\`\`\`

---

## Streaming Large Responses

\`\`\`python
from flask import Response, stream_with_context

@api_bp.route("/export/csv")
@login_required
def export_csv():
    def generate():
        yield "id,name,email\\n"
        for user in User.query.yield_per(100):
            yield f"{user.id},{user.name},{user.email}\\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )
\`\`\`

---

## Template Inheritance (Jinja2)

\`\`\`html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}App{% endblock %}</title>
    {% block head %}{% endblock %}
</head>
<body>
    {% with messages = get_flashed_messages(with_categories=true) %}
        {% for category, message in messages %}
            <div class="flash flash-{{ category }}">{{ message }}</div>
        {% endfor %}
    {% endwith %}

    {% block content %}{% endblock %}
</body>
</html>
\`\`\`

\`\`\`html
<!-- templates/auth/login.html -->
{% extends "base.html" %}
{% block title %}Login{% endblock %}
{% block content %}
<form method="post">
    {{ form.hidden_tag() }}
    {{ form.email.label }} {{ form.email(class="input") }}
    {{ form.password.label }} {{ form.password(class="input") }}
    <button type="submit">Login</button>
</form>
{% endblock %}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Flask-Specific Review
- Verify \`create_app()\` factory pattern is used — no global \`app = Flask(__name__)\` at module level
- Check extensions use deferred binding: instantiated at module level, bound with \`ext.init_app(app)\` inside factory
- Verify Blueprints are used for route organization — no monolithic routes file
- Check \`current_app\` is used inside request context, not a direct module-level \`app\` import
- Verify all request input (\`request.args\`, \`request.form\`, \`request.json\`) is validated before use
- Check for proper error handling: \`@app.errorhandler\` registered, consistent JSON error shapes for APIs
- Verify database sessions are request-scoped (Flask-SQLAlchemy default) and cleaned up via teardown
- Check secrets loaded from environment variables — no hardcoded SECRET_KEY, DATABASE_URL, or credentials
- Verify Flask-Migrate is used for all schema changes — no manual ALTER TABLE
- Check CORS is configured with specific origins — no wildcard \`*\` in production
- Verify debug mode is disabled in production configuration (\`DEBUG=False\`)
- Check session cookies have SECURE, HTTPONLY, and SAMESITE flags set
- Verify CSRF protection is active for form submissions (Flask-WTF)
- Check that \`url_for()\` is used for URL generation — no hardcoded paths
- Verify development server is NOT used in production — Gunicorn/uWSGI/Waitress configured

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint scaffolding, \`flask-migration-generator\` for database migrations.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Flask Testing
- Create test-specific app instances via \`create_app("config.TestingConfig")\` in fixtures
- Use \`app.test_client()\` for HTTP-level integration tests
- Use \`app.test_cli_runner()\` for testing custom CLI commands
- Define fixtures in \`conftest.py\`: \`app\`, \`client\`, \`db_session\`, \`runner\`
- Set \`TESTING=True\` and \`WTF_CSRF_ENABLED=False\` in test config
- Use \`client.session_transaction()\` to pre-populate session for auth tests
- Use \`app.test_request_context()\` for testing code that needs request context outside HTTP
- Test each Blueprint route: success (200/201), validation errors (400/422), auth failures (401/403), not found (404)
- Test JSON endpoints with \`client.post("/path", json={...})\` and assert \`response.json\`
- Test form submissions with \`client.post("/path", data={...})\`
- Test redirects with \`follow_redirects=True\` and check \`response.history\`
- Use an in-memory SQLite database for test isolation (\`sqlite:///:memory:\`)
- Roll back database transactions between tests — never persist test data
- Override services with mocks via dependency injection or monkeypatch

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint + test scaffolding, \`flask-migration-generator\` for migration management.`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Flask-Specific Security Review
- [ ] \`SECRET_KEY\` loaded from environment — not hardcoded, not the default \`"dev"\`
- [ ] \`SESSION_COOKIE_SECURE=True\` in production (requires HTTPS)
- [ ] \`SESSION_COOKIE_HTTPONLY=True\` to prevent XSS session theft
- [ ] \`SESSION_COOKIE_SAMESITE="Lax"\` or \`"Strict"\` to mitigate CSRF
- [ ] CSRF protection enabled for all POST/PUT/DELETE forms (Flask-WTF)
- [ ] \`DEBUG=False\` in production — interactive debugger disabled
- [ ] No \`app.run(debug=True)\` in production entry point
- [ ] \`ProxyFix\` middleware applied when behind reverse proxy (prevents IP spoofing)
- [ ] CORS restricted to specific origins — \`Access-Control-Allow-Origin\` is not \`*\`
- [ ] Static files served by nginx/Apache in production — not by Flask
- [ ] Input validation on all \`request.json\`, \`request.form\`, \`request.args\`
- [ ] File upload validation: check extension, size limit, content type
- [ ] SQL queries use ORM or parameterized statements — no f-string SQL
- [ ] Error responses do not expose stack traces, file paths, or config values
- [ ] Authentication routes are rate-limited to prevent brute force
- [ ] \`send_file()\` / \`send_from_directory()\` used for file serving — never open() + return

**Available skills:** Use \`flask-blueprint-generator\` for secure Blueprint scaffolding, \`flask-migration-generator\` for migration management.`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Flask-Specific Refactoring
- Extract monolithic \`app.py\` into application factory + Blueprints + services
- Move business logic out of route handlers into a services/ layer
- Replace global \`app\` imports with \`current_app\` proxy inside request context
- Replace \`app = Flask(__name__); db = SQLAlchemy(app)\` with deferred \`db = SQLAlchemy()\` + \`init_app()\`
- Replace inline SQL with Flask-SQLAlchemy ORM queries
- Replace manual \`dict\` serialization with Marshmallow schemas or Pydantic models
- Move configuration from \`app.config[...] = ...\` scattered calls to config classes
- Replace \`@app.route\` with Blueprint routes when file grows beyond 10 routes
- Extract repeated \`before_request\` logic into Blueprint-level hooks or decorators
- Replace \`print()\` debugging with \`app.logger\` or structured \`logging\` module
- Move test setup into \`conftest.py\` fixtures using the application factory

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint refactoring, \`flask-migration-generator\` for migration management.`,
      },
    ],
    skills: [
      {
        name: 'flask-blueprint-generator',
        description: 'Generate Flask Blueprints with routes, validation, error handling, and tests',
        content: `# Flask Blueprint Generator

## What It Generates
Given a resource name (e.g. "products"), generate a complete Blueprint with:

### 1. Blueprint Module
\`\`\`python
# app/views/{resource}.py
from flask import Blueprint, request, jsonify, abort
from app.services.{resource}_service import {Resource}Service
from app.schemas.{resource}_schema import (
    Create{Resource}Schema,
    Update{Resource}Schema,
    {Resource}ResponseSchema,
)

{resource}_bp = Blueprint("{resource}", __name__)

@{resource}_bp.route("/", methods=["GET"])
def list_{resource}s():
    items = {Resource}Service.list_all()
    return jsonify({Resource}ResponseSchema(many=True).dump(items))

@{resource}_bp.route("/", methods=["POST"])
def create_{resource}():
    schema = Create{Resource}Schema()
    data = schema.load(request.get_json())
    item = {Resource}Service.create(data)
    return jsonify({Resource}ResponseSchema().dump(item)), 201

@{resource}_bp.route("/<int:id>", methods=["GET"])
def get_{resource}(id: int):
    item = {Resource}Service.get_by_id(id)
    if not item:
        abort(404)
    return jsonify({Resource}ResponseSchema().dump(item))

@{resource}_bp.route("/<int:id>", methods=["PUT"])
def update_{resource}(id: int):
    schema = Update{Resource}Schema()
    data = schema.load(request.get_json())
    item = {Resource}Service.update(id, data)
    return jsonify({Resource}ResponseSchema().dump(item))

@{resource}_bp.route("/<int:id>", methods=["DELETE"])
def delete_{resource}(id: int):
    {Resource}Service.delete(id)
    return "", 204
\`\`\`

### 2. Service Layer (framework-agnostic business logic)
### 3. Marshmallow Schemas (validation + serialization)
### 4. SQLAlchemy Model
### 5. pytest Tests using app.test_client() with fixture-based setup

## Registration
\`\`\`python
# In create_app():
from app.views.{resource} import {resource}_bp
app.register_blueprint({resource}_bp, url_prefix="/{resource}s")
\`\`\`
`,
      },
      {
        name: 'flask-migration-generator',
        description: 'Generate and manage Flask-Migrate (Alembic) database migrations',
        content: `# Flask-Migrate Migration Generator

## Initial Setup
\`\`\`bash
flask db init                    # Create migrations/ directory (one-time)
flask db migrate -m "description" # Auto-generate migration from model changes
flask db upgrade                 # Apply pending migrations
flask db downgrade               # Revert last migration
flask db history                 # Show migration history
flask db current                 # Show current database revision
\`\`\`

## Migration Best Practices
- Always review auto-generated migrations before applying — they can miss renames
- Write a descriptive message with \`-m\` for every migration
- Test migrations on a copy of production data before deploying
- Never edit migrations that have already been applied to shared environments
- Include both upgrade() and downgrade() functions in every migration
- For data migrations, write explicit SQL or use bulk_insert_mappings()

## Common Operations
\`\`\`python
# Add column with default value
op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default="true"))

# Create index
op.create_index("ix_users_email", "users", ["email"], unique=True)

# Rename column (not auto-detected)
op.alter_column("users", "name", new_column_name="full_name")
\`\`\`
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "app\\.run\\(.*debug\\s*=\\s*True" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:1:Flask debug mode enabled in code — use FLASK_DEBUG env var instead, never app.run(debug=True) in production" || true',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "(SECRET_KEY|secret_key)\\s*=\\s*[\"\\x27][^\"\\x27]{0,20}[\"\\x27]" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:1:Hardcoded SECRET_KEY detected — load from environment variable: os.environ[\\\"SECRET_KEY\\\"]" || true',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "send_file\\(.*request\\." "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:0:Warning: send_file() with user input detected — verify path traversal protection, prefer send_from_directory()" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
