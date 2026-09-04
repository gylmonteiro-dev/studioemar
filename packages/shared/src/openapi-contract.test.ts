import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { z } from 'zod';
import {
  authSessionSchema,
  bookingKindSchema,
  bookingSchema,
  bookingStatusSchema,
  cancelledBySchema,
  cancellationSchema,
  createStudentRequestSchema,
  creditSchema,
  creditSourceSchema,
  creditStatusSchema,
  firstAccessRequestSchema,
  loginRequestSchema,
  occupancyDashboardSchema,
  recoverRequestSchema,
  refreshRequestSchema,
  resetPasswordRequestSchema,
  studioClosureSchema,
  timeSlotSchema,
  timeSlotStatusSchema,
  userRoleSchema,
  userSchema,
  waitlistEntrySchema,
} from './index.js';

const openapiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../docs/openapi.yaml',
);

type OpenApiSchema = {
  required?: string[];
  properties?: Record<string, { enum?: string[] }>;
};

type OpenApiDoc = {
  paths: Record<string, unknown>;
  components: { schemas: Record<string, OpenApiSchema> };
};

const OPENAPI_PATHS = [
  '/health',
  '/auth/login',
  '/auth/first-access',
  '/auth/refresh',
  '/auth/recover',
  '/auth/reset-password',
  '/me',
  '/plans',
  '/students',
  '/students/{id}',
  '/students/{id}/bookings',
  '/students/{id}/credits',
  '/time-slots',
  '/time-slots/{id}',
  '/time-slots/{id}/bookings',
  '/time-slots/{id}/waitlist',
  '/recurring-slots',
  '/recurring-slots/{id}',
  '/closures',
  '/credits',
  '/credits/{id}/annulments',
  '/me/bookings',
  '/bookings/{id}/cancellations',
  '/me/credits',
  '/credits/{id}/redemptions',
  '/dashboard',
] as const;

const SCHEMA_MAP: Record<string, z.ZodTypeAny> = {
  LoginRequest: loginRequestSchema,
  FirstAccessRequest: firstAccessRequestSchema,
  RecoverRequest: recoverRequestSchema,
  ResetPasswordRequest: resetPasswordRequestSchema,
  RefreshRequest: refreshRequestSchema,
  AuthSession: authSessionSchema,
  CreateStudentRequest: createStudentRequestSchema,
  User: userSchema,
  Booking: bookingSchema,
  Cancellation: cancellationSchema,
  Credit: creditSchema,
  TimeSlot: timeSlotSchema,
  StudioClosure: studioClosureSchema,
  WaitlistEntry: waitlistEntrySchema,
  OccupancyDashboard: occupancyDashboardSchema,
};

function unwrapObject(schema: z.ZodTypeAny): z.ZodObject<z.ZodRawShape> {
  const def = schema as z.ZodTypeAny & {
    _def?: { typeName?: string; schema?: z.ZodTypeAny };
    shape?: z.ZodRawShape;
  };
  if (def._def?.typeName === 'ZodEffects' && def._def.schema) {
    return unwrapObject(def._def.schema);
  }
  if (!def.shape) {
    throw new Error('schema Zod não é objeto');
  }
  return def as unknown as z.ZodObject<z.ZodRawShape>;
}

function zodKeys(schema: z.ZodTypeAny): string[] {
  return Object.keys(unwrapObject(schema).shape).sort();
}

function zodRequired(schema: z.ZodTypeAny): string[] {
  return Object.entries(unwrapObject(schema).shape)
    .flatMap(([key, value]) => {
      const typeName = (value as { _def?: { typeName?: string } })._def
        ?.typeName;
      if (typeName === 'ZodOptional' || typeName === 'ZodDefault') {
        return [];
      }
      return [key];
    })
    .sort();
}

describe('contrato OpenAPI × Zod', () => {
  const doc = parse(readFileSync(openapiPath, 'utf8')) as OpenApiDoc;

  it('documenta os paths da FASE 6', () => {
    assert.deepEqual(Object.keys(doc.paths).sort(), [...OPENAPI_PATHS].sort());
  });

  it('mantém as chaves dos schemas alinhadas ao Zod', () => {
    for (const [name, schema] of Object.entries(SCHEMA_MAP)) {
      const component = doc.components.schemas[name];
      assert.ok(component, `schema OpenAPI ausente: ${name}`);
      const openApiKeys = Object.keys(component.properties ?? {}).sort();
      assert.deepEqual(openApiKeys, zodKeys(schema), name);
      const openApiRequired = [...(component.required ?? [])].sort();
      for (const key of zodRequired(schema)) {
        assert.ok(
          openApiRequired.includes(key),
          `${name}: Zod exige ${key}, OpenAPI não`,
        );
      }
      for (const key of openApiRequired) {
        assert.ok(
          zodKeys(schema).includes(key),
          `${name}: OpenAPI exige ${key}, Zod não tem a chave`,
        );
      }
    }
  });

  it('alinha enums de papel, reserva, crédito e horário', () => {
    const cases: Array<[string, string, string[]]> = [
      ['User', 'role', [...userRoleSchema.options]],
      ['Booking', 'kind', [...bookingKindSchema.options]],
      ['Booking', 'status', [...bookingStatusSchema.options]],
      ['Cancellation', 'cancelledBy', [...cancelledBySchema.options]],
      ['Credit', 'source', [...creditSourceSchema.options]],
      ['Credit', 'status', [...creditStatusSchema.options]],
      ['TimeSlot', 'status', [...timeSlotStatusSchema.options]],
    ];

    for (const [schemaName, property, zodEnum] of cases) {
      const enumerated =
        doc.components.schemas[schemaName]?.properties?.[property]?.enum;
      assert.deepEqual(enumerated, zodEnum, `${schemaName}.${property}`);
    }
  });

  it('não expõe passwordHash no User', () => {
    const user = doc.components.schemas.User;
    assert.equal(user?.properties?.passwordHash, undefined);
    const parsed = userSchema.parse({
      id: 'user-joao',
      name: 'João',
      email: 'joao@studioemar.local',
      role: 'STUDENT',
    });
    assert.equal('passwordHash' in parsed, false);
  });
});
