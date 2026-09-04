'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { annulCredit, listCredits, listStudents } from '@/lib/api';
import { creditSourceLabel, creditStatusLabel } from '@/lib/credit-copy';
import { formatDateLong } from '@/lib/format';
import { useTrainer } from '@/lib/trainer-context';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';
import { useState } from 'react';

export default function TreinadorCreditosPage() {
  const trainer = useTrainer();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(async () => {
    const [credits, students] = await Promise.all([listCredits(), listStudents()]);
    return { credits, students };
  }, []);
  const [annulId, setAnnulId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!trainer) {
    return null;
  }

  const list = (data?.credits ?? []).slice().sort(
    (left, right) =>
      new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime(),
  );
  const studentsById = new Map(
    (data?.students ?? []).map((student) => [student.id, student]),
  );

  async function confirmAnnul() {
    if (!annulId) {
      return;
    }
    setBusy(true);
    try {
      await annulCredit(annulId);
      toast('Crédito anulado.');
      setAnnulId(null);
      reload();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Não foi possível anular');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLoadState loading={loading} error={error}>
      <PageCanvas>
        <section>
          <h1 className="text-3xl font-bold text-foreground">Créditos</h1>
          <p className="mt-1 text-muted-foreground">
            Sem crédito avulso. Origem sempre de uma aula ou fechamento com compensação.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          {list.length === 0 ? (
            <p className="text-muted-foreground">Nenhum crédito registrado.</p>
          ) : (
            list.map((credit) => {
              const student = studentsById.get(credit.studentId);
              return (
                <Card
                  key={credit.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {student?.name ?? credit.studentId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {creditSourceLabel(credit.source)} · {formatDateLong(credit.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        credit.status === 'AVAILABLE'
                          ? 'success'
                          : credit.status === 'ANNULLED'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {creditStatusLabel(credit.status)}
                    </Badge>
                    {student ? (
                      <Link
                        href={`/treinador/alunos/${student.id}`}
                        className="font-mono text-xs uppercase tracking-widest text-accent"
                      >
                        Aluno
                      </Link>
                    ) : null}
                    {credit.status === 'AVAILABLE' ? (
                      <Button variant="danger" onClick={() => setAnnulId(credit.id)}>
                        Anular
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })
          )}
        </section>

        <Modal open={annulId !== null} title="Anular crédito" onClose={() => setAnnulId(null)}>
          <p className="text-muted-foreground">
            A anulação fica no histórico com status anulado.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setAnnulId(null)}>
              Manter
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmAnnul}
              disabled={busy}
            >
              Anular
            </Button>
          </div>
        </Modal>
      </PageCanvas>
    </PageLoadState>
  );
}
