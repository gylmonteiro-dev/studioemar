import type { CreditSource, CreditStatus } from '@studioemar/shared';

export function creditSourceLabel(source: CreditSource): string {
  switch (source) {
    case 'CANCELLATION':
      return 'Cancelamento';
    case 'TRAINER_CANCELLATION':
      return 'Cancelamento pelo professor';
    case 'CLOSURE_COMPENSATION':
      return 'Compensação de fechamento';
  }
}

export function creditStatusLabel(status: CreditStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Ativo';
    case 'USED':
      return 'Utilizado';
    case 'EXPIRED':
      return 'Expirado';
    case 'ANNULLED':
      return 'Anulado';
  }
}
