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
import { kotlinProfile } from './registry/languages/kotlin.profile.js';
import { swiftProfile } from './registry/languages/swift.profile.js';
import { dartProfile } from './registry/languages/dart.profile.js';
// Framework profiles
import { reactProfile } from './registry/frameworks/react.profile.js';
import { nextjsProfile } from './registry/frameworks/nextjs.profile.js';
import { expressProfile } from './registry/frameworks/express.profile.js';
import { nestjsProfile } from './registry/frameworks/nestjs.profile.js';
import { fastapiProfile } from './registry/frameworks/fastapi.profile.js';
import { pydanticProfile } from './registry/frameworks/pydantic.profile.js';
import { langchainProfile } from './registry/frameworks/langchain.profile.js';
import { springBootProfile } from './registry/frameworks/spring-boot.profile.js';
import { djangoProfile } from './registry/frameworks/django.profile.js';
import { angularProfile } from './registry/frameworks/angular.profile.js';
import { vueProfile } from './registry/frameworks/vue.profile.js';
import { flaskProfile } from './registry/frameworks/flask.profile.js';
import { nuxtProfile } from './registry/frameworks/nuxt.profile.js';
import { svelteProfile } from './registry/frameworks/svelte.profile.js';
import { ginProfile } from './registry/frameworks/gin.profile.js';
import { echoProfile } from './registry/frameworks/echo.profile.js';
import { fiberProfile } from './registry/frameworks/fiber.profile.js';
import { actixWebProfile } from './registry/frameworks/actix-web.profile.js';
import { axumProfile } from './registry/frameworks/axum.profile.js';
import { rocketProfile } from './registry/frameworks/rocket.profile.js';
import { reactNativeProfile } from './registry/frameworks/react-native.profile.js';
import { expoProfile } from './registry/frameworks/expo.profile.js';
import { flutterProfile } from './registry/frameworks/flutter.profile.js';
import { swiftuiProfile } from './registry/frameworks/swiftui.profile.js';
import { jetpackComposeProfile } from './registry/frameworks/jetpack-compose.profile.js';
// Testing profiles
import { jestProfile } from './registry/testing/jest.profile.js';
import { vitestProfile } from './registry/testing/vitest.profile.js';
import { pytestProfile } from './registry/testing/pytest.profile.js';
import { junitProfile } from './registry/testing/junit.profile.js';
import { cypressProfile } from './registry/testing/cypress.profile.js';
import { playwrightProfile } from './registry/testing/playwright.profile.js';
import { detoxProfile } from './registry/testing/detox.profile.js';
import { xctestProfile } from './registry/testing/xctest.profile.js';
import { espressoProfile } from './registry/testing/espresso.profile.js';
// Infra profiles
import { dockerProfile } from './registry/infra/docker.profile.js';
import { kubernetesProfile } from './registry/infra/kubernetes.profile.js';
import { githubActionsProfile } from './registry/infra/github-actions.profile.js';
import { awsProfile } from './registry/infra/aws.profile.js';
import { googleCloudProfile } from './registry/infra/google-cloud.profile.js';
import { terraformProfile } from './registry/infra/terraform.profile.js';
import { vercelProfile } from './registry/infra/vercel.profile.js';
import { fastlaneProfile } from './registry/infra/fastlane.profile.js';

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
  kotlinProfile,
  swiftProfile,
  dartProfile,
  // Frameworks (layer 20)
  reactProfile,
  nextjsProfile,
  expressProfile,
  nestjsProfile,
  fastapiProfile,
  pydanticProfile,
  langchainProfile,
  springBootProfile,
  djangoProfile,
  angularProfile,
  vueProfile,
  flaskProfile,
  nuxtProfile,
  svelteProfile,
  ginProfile,
  echoProfile,
  fiberProfile,
  actixWebProfile,
  axumProfile,
  rocketProfile,
  reactNativeProfile,
  expoProfile,
  flutterProfile,
  swiftuiProfile,
  jetpackComposeProfile,
  // Testing (layer 30)
  jestProfile,
  vitestProfile,
  pytestProfile,
  junitProfile,
  cypressProfile,
  playwrightProfile,
  detoxProfile,
  xctestProfile,
  espressoProfile,
  // Infra (layer 40)
  dockerProfile,
  kubernetesProfile,
  githubActionsProfile,
  awsProfile,
  googleCloudProfile,
  terraformProfile,
  vercelProfile,
  fastlaneProfile,
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
