import type { ComposedConfig, DetectionResult, Profile } from '../core/types.js';
import { ProfileComposer } from './composer.js';

// Base profiles
import { universalProfile } from './registry/base/universal.profile.js';
// Language profiles
import { typescriptProfile } from './registry/languages/typescript.profile.js';
import { pythonProfile } from './registry/languages/python.profile.js';
import { javaProfile } from './registry/languages/java.profile.js';
import { goProfile } from './registry/languages/go.profile.js';
import { rustProfile } from './registry/languages/rust.profile.js';
import { csharpProfile } from './registry/languages/csharp.profile.js';
// Framework profiles
import { reactProfile } from './registry/frameworks/react.profile.js';
import { nextjsProfile } from './registry/frameworks/nextjs.profile.js';
import { expressProfile } from './registry/frameworks/express.profile.js';
import { nestjsProfile } from './registry/frameworks/nestjs.profile.js';
import { fastapiProfile } from './registry/frameworks/fastapi.profile.js';
import { springBootProfile } from './registry/frameworks/spring-boot.profile.js';
import { djangoProfile } from './registry/frameworks/django.profile.js';
import { angularProfile } from './registry/frameworks/angular.profile.js';
import { vueProfile } from './registry/frameworks/vue.profile.js';
import { flaskProfile } from './registry/frameworks/flask.profile.js';
import { nuxtProfile } from './registry/frameworks/nuxt.profile.js';
import { svelteProfile } from './registry/frameworks/svelte.profile.js';
// Testing profiles
import { jestProfile } from './registry/testing/jest.profile.js';
import { vitestProfile } from './registry/testing/vitest.profile.js';
import { pytestProfile } from './registry/testing/pytest.profile.js';
import { junitProfile } from './registry/testing/junit.profile.js';
import { cypressProfile } from './registry/testing/cypress.profile.js';
import { playwrightProfile } from './registry/testing/playwright.profile.js';
// Infra profiles
import { dockerProfile } from './registry/infra/docker.profile.js';
import { kubernetesProfile } from './registry/infra/kubernetes.profile.js';
import { githubActionsProfile } from './registry/infra/github-actions.profile.js';
import { awsProfile } from './registry/infra/aws.profile.js';
import { terraformProfile } from './registry/infra/terraform.profile.js';
import { vercelProfile } from './registry/infra/vercel.profile.js';

/** All registered profiles */
const ALL_PROFILES: Profile[] = [
  // Base (layer 0)
  universalProfile,
  // Languages (layer 10)
  typescriptProfile,
  pythonProfile,
  javaProfile,
  goProfile,
  rustProfile,
  csharpProfile,
  // Frameworks (layer 20)
  reactProfile,
  nextjsProfile,
  expressProfile,
  nestjsProfile,
  fastapiProfile,
  springBootProfile,
  djangoProfile,
  angularProfile,
  vueProfile,
  flaskProfile,
  nuxtProfile,
  svelteProfile,
  // Testing (layer 30)
  jestProfile,
  vitestProfile,
  pytestProfile,
  junitProfile,
  cypressProfile,
  playwrightProfile,
  // Infra (layer 40)
  dockerProfile,
  kubernetesProfile,
  githubActionsProfile,
  awsProfile,
  terraformProfile,
  vercelProfile,
];

/** Get all registered profiles */
export function getAllProfiles(): Profile[] {
  return [...ALL_PROFILES];
}

/** Get a profile by ID */
export function getProfileById(id: string): Profile | undefined {
  return ALL_PROFILES.find((p) => p.id === id);
}

/** Main profile composer - detects applicable profiles and composes them */
export class ProfileEngine {
  private composer: ProfileComposer;

  constructor() {
    this.composer = new ProfileComposer();
  }

  /** Compose all applicable profiles for a detection result */
  compose(detection: DetectionResult): ComposedConfig {
    return this.composer.compose(ALL_PROFILES, detection);
  }
}

export { ProfileComposer } from './composer.js';
