'use client';

import { PageCanvas } from '@/components/layout/page-canvas';
import { ClosuresPanel } from '@/components/trainer/closures-panel';
import { PlansPanel } from '@/components/trainer/plans-panel';
import {
  SettingsSection,
  type SettingsSectionId,
} from '@/components/trainer/settings-section';
import { StudioHoursPanel } from '@/components/trainer/studio-hours-panel';
import { canManageAccess } from '@/lib/auth-routing';
import { useTrainer } from '@/lib/trainer-context';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function parseSection(value: string | null): SettingsSectionId | null {
  if (value === 'horarios' || value === 'planos' || value === 'fechamento') {
    return value;
  }
  return null;
}

function AjustesHub() {
  const trainer = useTrainer();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState<SettingsSectionId | null>(() =>
    parseSection(searchParams.get('secao')),
  );
  const canManage = Boolean(trainer && canManageAccess(trainer.role));

  if (!trainer) {
    return null;
  }

  if (!canManage) {
    return (
      <PageCanvas>
        <h1 className="text-3xl font-bold text-foreground">Ajustes</h1>
        <p className="mt-2 text-muted-foreground">
          Apenas o proprietário e o administrador acessam horários, planos e
          fechamentos.
        </p>
      </PageCanvas>
    );
  }

  function toggle(id: SettingsSectionId) {
    setOpen((current) => (current === id ? null : id));
  }

  return (
    <PageCanvas>
      <section>
        <h1 className="text-3xl font-bold text-foreground">Ajustes</h1>
        <p className="mt-1 text-muted-foreground">
          Horários do estúdio, modelos de plano e fechamentos do studio.
        </p>
      </section>
      <SettingsSection
        id="horarios"
        title="Horários"
        open={open === 'horarios'}
        onToggle={() => toggle('horarios')}
      >
        <StudioHoursPanel />
      </SettingsSection>
      <SettingsSection
        id="planos"
        title="Planos"
        open={open === 'planos'}
        onToggle={() => toggle('planos')}
      >
        <PlansPanel />
      </SettingsSection>
      <SettingsSection
        id="fechamento"
        title="Fechamento"
        open={open === 'fechamento'}
        onToggle={() => toggle('fechamento')}
      >
        <ClosuresPanel />
      </SettingsSection>
    </PageCanvas>
  );
}

export default function TreinadorConfiguracoesPage() {
  return (
    <Suspense fallback={null}>
      <AjustesHub />
    </Suspense>
  );
}
