'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadState } from '@/components/ui/load-state';
import { listPlans, listStudents } from '@/lib/api';
import { useAsync } from '@/lib/use-async';
import Link from 'next/link';

export default function TreinadorAlunosPage() {
  const { data, error, loading } = useAsync(async () => {
    const [students, plans] = await Promise.all([listStudents(), listPlans()]);
    return { students, plans };
  }, []);

  return (
    <PageLoadState loading={loading} error={error}>
      {data ? (
        <PageCanvas>
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
              <p className="mt-1 text-muted-foreground">
                Contas criadas pelo Studio. O aluno define a senha no primeiro acesso.
              </p>
            </div>
            <Link href="/treinador/alunos/novo">
              <Button variant="cta">Novo aluno</Button>
            </Link>
          </section>

          <section className="flex flex-col gap-3">
            {data.students.length === 0 ? (
              <p className="text-muted-foreground">Nenhum aluno cadastrado.</p>
            ) : (
              data.students.map((student) => {
                const plan = data.plans.find((item) => item.id === student.planId);
                return (
                  <Link key={student.id} href={`/treinador/alunos/${student.id}`}>
                    <Card className="flex items-center justify-between p-4 transition-colors hover:border-border-hover">
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                          {plan?.name ?? 'Sem plano'}
                        </p>
                      </div>
                      {student.mustSetPassword ? (
                        <Badge variant="warning">1º acesso</Badge>
                      ) : (
                        <Badge variant="success">Ativo</Badge>
                      )}
                    </Card>
                  </Link>
                );
              })
            )}
          </section>
        </PageCanvas>
      ) : null}
    </PageLoadState>
  );
}
