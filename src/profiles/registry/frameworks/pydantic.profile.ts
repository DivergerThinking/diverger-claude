import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const pydanticProfile: Profile = {
  id: 'frameworks/pydantic',
  name: 'Pydantic',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['pydantic'],
  contributions: {
    claudeMd: [
      {
        heading: 'Pydantic Conventions',
        order: 21,
        content: `## Pydantic Conventions

Pydantic v2 for data validation and settings management. Use \`BaseModel\` for structured data, \`field_validator\` / \`model_validator\` for custom logic.

**Detailed rules:** see \`.claude/rules/pydantic/\` directory.

**Key rules:**
- Always use Pydantic v2 API (\`model_validate\`, \`model_dump\`, \`field_validator\`) — not v1 aliases
- Define \`model_config\` with \`ConfigDict\` — never use the inner \`class Config\`
- Use \`Field()\` for all constraints (min_length, ge, le, pattern) and metadata
- Prefer strict mode (\`strict=True\`) at model or field level to prevent silent coercions`,
      },
    ],
    rules: [
      {
        path: 'pydantic/models.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'Pydantic v2 model definitions, validators, and configuration patterns',
        content: `# Pydantic v2 Model Patterns

## Model Definition

- Always inherit from \`pydantic.BaseModel\` for data validation models
- Use \`pydantic_settings.BaseSettings\` for configuration/settings models
- Define \`model_config = ConfigDict(...)\` at the class level — never use the inner \`class Config\`
- Use \`from __future__ import annotations\` for forward reference support

## ConfigDict Options

\`\`\`python
from pydantic import BaseModel, ConfigDict

class MyModel(BaseModel):
    model_config = ConfigDict(
        strict=True,              # Reject implicit type coercions
        frozen=True,              # Make instances immutable (hashable)
        from_attributes=True,     # Enable ORM mode (from SQLAlchemy objects)
        populate_by_name=True,    # Allow both alias and field name for input
        str_strip_whitespace=True # Auto-strip leading/trailing whitespace
    )
\`\`\`

## Field Definitions

- Use \`Field()\` for all constraints, aliases, and metadata — never bare defaults
- Set \`alias\` for JSON serialization names differing from Python attribute names
- Use \`default_factory\` for mutable defaults (lists, dicts, sets)
- Use \`exclude=True\` for fields that should never appear in serialized output

\`\`\`python
from pydantic import BaseModel, Field
from datetime import datetime

class User(BaseModel):
    id: int = Field(..., ge=1, description="Positive user ID")
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: str = Field(..., description="Valid email address")
    tags: list[str] = Field(default_factory=list)
    _internal: str = Field(default="", exclude=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
\`\`\`

## Field Validators

- Use \`@field_validator\` (v2) — not \`@validator\` (v1, deprecated)
- Specify \`mode='before'\` for pre-coercion transforms, \`mode='after'\` (default) for post-coercion checks
- Return the (possibly transformed) value — never mutate in place

\`\`\`python
from pydantic import BaseModel, field_validator

class Product(BaseModel):
    price: float
    sku: str

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('price must be greater than 0')
        return v

    @field_validator('sku', mode='before')
    @classmethod
    def normalize_sku(cls, v: str) -> str:
        return v.strip().upper()
\`\`\`

## Model Validators

- Use \`@model_validator(mode='after')\` for cross-field validation after individual fields are validated
- Use \`@model_validator(mode='before')\` for raw input transformations before field parsing

\`\`\`python
from pydantic import BaseModel, model_validator
from typing import Self

class DateRange(BaseModel):
    start_date: date
    end_date: date

    @model_validator(mode='after')
    def end_after_start(self) -> Self:
        if self.end_date <= self.start_date:
            raise ValueError('end_date must be after start_date')
        return self
\`\`\`

## Computed Fields

- Use \`@computed_field\` for properties that should be included in serialization

\`\`\`python
from pydantic import BaseModel, computed_field

class Rectangle(BaseModel):
    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        return self.width * self.height
\`\`\`
`,
      },
      {
        path: 'pydantic/serialization.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'Pydantic v2 serialization, deserialization, and schema patterns',
        content: `# Pydantic v2 Serialization & Deserialization

## Deserialization (Parsing)

- Use \`Model.model_validate(data)\` — not deprecated \`Model.parse_obj(data)\`
- Use \`Model.model_validate_json(json_str)\` — not \`Model.parse_raw(json_str)\`
- Use \`Model.model_validate(obj, from_attributes=True)\` for ORM objects without global config

\`\`\`python
# From dict
user = User.model_validate({"id": 1, "username": "alice"})

# From JSON string
user = User.model_validate_json('{"id": 1, "username": "alice"}')

# From ORM object (SQLAlchemy, etc.)
user = User.model_validate(db_user, from_attributes=True)
\`\`\`

## Serialization (Dumping)

- Use \`model.model_dump()\` — not deprecated \`model.dict()\`
- Use \`model.model_dump_json()\` — not deprecated \`model.json()\`
- Pass \`exclude_none=True\` or \`exclude_unset=True\` for partial representations
- Pass \`by_alias=True\` when API consumers expect aliased field names

\`\`\`python
# Full dump
data = user.model_dump()

# Exclude unset fields (useful for PATCH semantics)
patch_data = user.model_dump(exclude_unset=True)

# Exclude None fields for clean JSON output
clean = user.model_dump(exclude_none=True, by_alias=True)

# JSON string
json_str = user.model_dump_json(by_alias=True)
\`\`\`

## Schema Generation

- Use \`Model.model_json_schema()\` — not deprecated \`Model.schema()\`
- Annotate fields with \`Field(description=...)\` and \`Field(examples=[...])\` for rich schemas

## Type Adapters

- Use \`TypeAdapter\` to validate/serialize arbitrary types (not just BaseModel subclasses)

\`\`\`python
from pydantic import TypeAdapter

adapter = TypeAdapter(list[int])
result = adapter.validate_python(["1", "2", "3"])  # [1, 2, 3]
\`\`\`

## Discriminated Unions

- Use \`Annotated[Union[A, B], Field(discriminator='type')]\` for polymorphic models

\`\`\`python
from typing import Annotated, Union, Literal
from pydantic import BaseModel, Field

class Cat(BaseModel):
    type: Literal['cat']
    meows: int

class Dog(BaseModel):
    type: Literal['dog']
    barks: int

Pet = Annotated[Union[Cat, Dog], Field(discriminator='type')]
\`\`\`
`,
      },
      {
        path: 'pydantic/settings.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Pydantic Settings management with environment variables',
        content: `# Pydantic Settings Management

## BaseSettings

- Use \`pydantic_settings.BaseSettings\` for all application configuration
- Load from environment variables automatically; use \`.env\` files for local development
- Cache the settings instance with \`@lru_cache\` — never construct Settings on every call
- Never hardcode secrets — all sensitive values must come from environment variables

\`\`\`python
from functools import lru_cache
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = Field(..., description="PostgreSQL connection URL")
    secret_key: SecretStr = Field(..., description="JWT signing secret")
    debug: bool = Field(default=False)
    allowed_hosts: list[str] = Field(default_factory=list)

@lru_cache
def get_settings() -> Settings:
    return Settings()
\`\`\`

## SecretStr

- Use \`SecretStr\` for passwords, API keys, and tokens — prevents accidental logging
- Access the underlying value with \`.get_secret_value()\` only at the point of use

## Nested Settings

- Use nested BaseModel/BaseSettings classes for grouped config sections
- Prefix nested env vars with the parent field name (e.g., \`DB__HOST\`, \`DB__PORT\`)

\`\`\`python
class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_nested_delimiter="__")
    db: DatabaseSettings
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Pydantic-Specific Review Checklist
- [ ] All models inherit from \`BaseModel\` (or \`BaseSettings\` for config)
- [ ] \`model_config = ConfigDict(...)\` used — no inner \`class Config\`
- [ ] \`Field()\` used for all constraints (min_length, ge, le, pattern) — no bare type annotations for validation
- [ ] \`@field_validator\` used (v2) — not deprecated \`@validator\` (v1)
- [ ] \`@model_validator(mode='after')\` used for cross-field validation
- [ ] \`model_validate()\` used for parsing — not deprecated \`parse_obj()\`
- [ ] \`model_dump()\` used for serialization — not deprecated \`dict()\` or \`json()\`
- [ ] \`model_dump_json()\` used — not deprecated \`model.json()\`
- [ ] Sensitive fields use \`SecretStr\` to prevent accidental logging
- [ ] Settings class cached with \`@lru_cache\` — not constructed on every call
- [ ] Mutable defaults use \`Field(default_factory=...)\` — not bare mutable literals
- [ ] Discriminated unions use \`Field(discriminator='field_name')\` for performance
- [ ] \`exclude=True\` on internal fields that must never appear in serialized output
- [ ] \`from_attributes=True\` set in \`ConfigDict\` for ORM-backed models`,
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "@validator\\b|class Config:" "$FILE_PATH" && { echo "Pydantic v1 API detected: replace @validator with @field_validator and class Config with model_config = ConfigDict(...)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for Pydantic v1 API usage',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "\\.dict\\(\\)|\\.json\\(\\)|\\.parse_obj\\(|\\.parse_raw\\(" "$FILE_PATH" && { echo "Pydantic v1 serialization API detected: use .model_dump(), .model_dump_json(), .model_validate() instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for deprecated Pydantic serialization methods',
          },
        ],
      },
    ],
  },
};
