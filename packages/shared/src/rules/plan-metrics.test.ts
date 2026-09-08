import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  monthlyClassCount,
  monthlyTrainingHours,
  normalizePlanName,
} from './plan-metrics.js';

describe('normalizePlanName', () => {
  it('grava o nome em maiúsculas e compacta espaços', () => {
    assert.equal(normalizePlanName('  3x  por semana '), '3X POR SEMANA');
  });
});

describe('métricas mensais do plano', () => {
  it('usa 4 semanas: 3x e 1h rendem 12 aulas e 12h', () => {
    assert.equal(monthlyClassCount(3), 12);
    assert.equal(monthlyTrainingHours(3, 60), 12);
  });

  it('proporciona horas quando a aula não dura 60 minutos', () => {
    assert.equal(monthlyTrainingHours(3, 90), 18);
  });
});
