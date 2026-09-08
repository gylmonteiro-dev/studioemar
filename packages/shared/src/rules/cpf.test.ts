import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatCpf, isValidCpf, normalizeCpf } from './cpf.js';

describe('normalizeCpf', () => {
  it('remove pontuação', () => {
    assert.equal(normalizeCpf('529.982.247-25'), '52998224725');
    assert.equal(normalizeCpf('52998224725'), '52998224725');
  });
});

describe('isValidCpf', () => {
  it('aceita CPF válido com ou sem pontuação', () => {
    assert.equal(isValidCpf('529.982.247-25'), true);
    assert.equal(isValidCpf('52998224725'), true);
    assert.equal(isValidCpf('111.444.777-35'), true);
  });

  it('rejeita dígitos repetidos e checksum inválido', () => {
    assert.equal(isValidCpf('000.000.000-00'), false);
    assert.equal(isValidCpf('11111111111'), false);
    assert.equal(isValidCpf('529.982.247-26'), false);
    assert.equal(isValidCpf('123'), false);
  });
});

describe('formatCpf', () => {
  it('aplica a máscara aos 11 dígitos', () => {
    assert.equal(formatCpf('52998224725'), '529.982.247-25');
    assert.equal(formatCpf('529.982'), '529.982');
  });
});
