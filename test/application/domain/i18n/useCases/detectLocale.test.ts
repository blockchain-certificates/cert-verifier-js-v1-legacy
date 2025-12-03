import domain from '../../../../../src/domain';

const originalNavigator = globalThis.navigator;

describe('domain i18n detectLocale use case test suite', function () {
  afterEach(function () {
    vi.unstubAllGlobals();
  });

  describe('given it detected the navigator locale', function () {
    beforeEach(function () {
      vi.stubGlobal('navigator', {
        ...originalNavigator,
        language: 'fr-FR'
      });
    });

    it('should return the detected locale', function () {
      const locale = domain.i18n.detectLocale();
      expect(locale).toBe('fr-FR');
    });
  });

  describe('given it did not get any navigator properties', function () {
    beforeEach(function () {
      vi.stubGlobal('navigator', {
        ...originalNavigator,
        language: null
      });
    });

    it('should return default locale', function () {
      const locale = domain.i18n.detectLocale();
      expect(locale).toBe('en-US');
    });
  });
});
