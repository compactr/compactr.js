import { schema } from '../../src';
import spec from '../../static/exampleSpec';

/* Tests --------------------------------------------------------------------- */

describe('OpenAPI spec test', () => {
  describe('Parse simple API response', () => {
    const Schema = schema(spec.components.schemas.SiteVerificationWebResourceGettokenResponse);

    const response = {
      method: 'META', token: 'abc',
    };

    it('should return the response object unchanged', () => {
      expect(Schema.read(Schema.write(response).buffer())).toEqual(response);
    });
  });

  describe('Parse API response with local $ref', () => {
    const Schema = schema(spec.components.schemas.SiteVerificationWebResourceListResponse, { schemas: spec });

    const response = {
      items: [{
        id: 'compactr',
        owners: [
          'bob',
          'mary',
        ],
        site: {
          identifier: 'compactr.js.org',
          type: 'SITE',
        },
      }],
    };

    it('should return the response object unchanged', () => {
      expect(Schema.read(Schema.write(response).buffer())).toEqual(response);
    });
  });
});
