import { describe, it, expect } from 'vitest';
import { mapDependencyToTechnology, mapDependencies } from '../../../src/evolution/dependency-mapper.js';

describe('Dependency Mapper', () => {
  describe('mapDependencyToTechnology', () => {
    it('should map known npm packages', () => {
      expect(mapDependencyToTechnology('next')).toBe('nextjs');
      expect(mapDependencyToTechnology('express')).toBe('express');
      expect(mapDependencyToTechnology('vitest')).toBe('vitest');
      expect(mapDependencyToTechnology('typescript')).toBe('typescript');
    });

    it('should map scoped packages', () => {
      expect(mapDependencyToTechnology('@nestjs/core')).toBe('nestjs');
      expect(mapDependencyToTechnology('@angular/core')).toBe('angular');
    });

    it('should return null for unknown packages', () => {
      expect(mapDependencyToTechnology('my-custom-lib')).toBeNull();
      expect(mapDependencyToTechnology('lodash')).toBeNull();
    });

    it('should map Python packages', () => {
      expect(mapDependencyToTechnology('fastapi')).toBe('fastapi');
      expect(mapDependencyToTechnology('django')).toBe('django');
    });

    it('should map Go modules', () => {
      expect(mapDependencyToTechnology('github.com/gin-gonic/gin')).toBe('gin');
    });

    it('should map Rust crates', () => {
      expect(mapDependencyToTechnology('actix-web')).toBe('actix');
      expect(mapDependencyToTechnology('tokio')).toBe('tokio');
    });
  });

  describe('mapDependencies', () => {
    it('should map multiple dependencies', () => {
      const result = mapDependencies(['next', 'lodash', 'vitest', 'chalk']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ dependency: 'next', technologyId: 'nextjs' });
      expect(result[1]).toEqual({ dependency: 'vitest', technologyId: 'vitest' });
    });

    it('should return empty for no mappable dependencies', () => {
      const result = mapDependencies(['lodash', 'chalk', 'uuid']);
      expect(result).toHaveLength(0);
    });
  });
});
