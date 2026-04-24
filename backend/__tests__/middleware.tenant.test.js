/**
 * Test: Tenant Middleware
 */

const { tenantSchemaName, setTenantContext } = require('../../src/middleware/tenant');

describe('Tenant Middleware', () => {
  describe('tenantSchemaName', () => {
    it('should generate valid schema name from slug', () => {
      const slug = 'acme-corp';
      const schema = tenantSchemaName(slug);
      expect(schema).toBe('tenant_acme-corp');
    });

    it('should convert to lowercase', () => {
      const slug = 'ACME';
      const schema = tenantSchemaName(slug);
      expect(schema).toBe('tenant_acme');
    });

    it('should reject invalid slugs', () => {
      expect(tenantSchemaName('acme; DROP TABLE')).toBeNull();
      expect(tenantSchemaName('acme@example.com')).toBeNull();
      expect(tenantSchemaName('')).toBeNull();
      expect(tenantSchemaName(null)).toBeNull();
    });

    it('should allow alphanumeric and underscore', () => {
      const slug = 'acme_corp_2024';
      const schema = tenantSchemaName(slug);
      expect(schema).toBe('tenant_acme_corp_2024');
    });
  });
});
