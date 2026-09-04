'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { WorkoutCard } from '@/components/student/workout-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { availableCredits, upcomingConfirmed, useStudioMock } from '@/lib/mock-api';
import { useStudent } from '@/lib/student-context';
import Link from 'next/link';

export default function AlunoHomePage() {
  const student = useStudent();
  useStudioMock();
  if (!student) {
    return null;
  }

  const upcoming = upcomingConfirmed(student.id);
  const [next, ...rest] = upcoming;
  const credits = availableCredits(student.id).length;

  return (
    <PageCanvas>
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
          Olá, {student.name}
        </h1>
        <p className="mt-2 text-muted-foreground">Pronto para o treino?</p>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="flex flex-col gap-8 md:col-span-8">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">
              Seu próximo treino
            </h2>
            {next ? (
              <WorkoutCard
                featured
                href={`/aluno/agenda/${next.booking.id}`}
                startsAt={next.slot.startsAt}
                classType={next.slot.classType}
              />
            ) : (
              <Card>
                <p className="text-muted-foreground">Nenhum treino confirmado à frente.</p>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">
              Próximos treinos
            </h2>
            <div className="flex flex-col gap-3">
              {rest.length === 0 ? (
                <p className="text-muted-foreground">Nenhum outro treino nesta sequência.</p>
              ) : (
                rest.map((item) => (
                  <WorkoutCard
                    key={item.booking.id}
                    href={`/aluno/agenda/${item.booking.id}`}
                    startsAt={item.slot.startsAt}
                    classType={item.slot.classType}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="md:col-span-4">
          <h2 className="mb-3 text-xl font-semibold text-foreground">Seus créditos</h2>
          <Card className="flex flex-col items-center text-center">
            <p className="text-3xl font-extrabold text-foreground">{credits}</p>
            <p className="mt-1 text-muted-foreground">
              {credits === 1 ? 'reposição disponível' : 'reposições disponíveis'}
            </p>
            <Link href="/aluno/horarios" className="mt-6 w-full">
              <Button variant="ghost" className="w-full">
                Agendar reposição
              </Button>
            </Link>
          </Card>
        </section>
      </div>
    </PageCanvas>
  );
}
