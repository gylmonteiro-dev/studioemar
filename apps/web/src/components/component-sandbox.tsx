'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export function ComponentSandbox() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sandbox temporário
        </p>
        <h1 className="text-3xl font-bold text-foreground">Studio EMAR</h1>
        <p className="text-muted-foreground">
          Primitives da FASE 1. Esta página some antes da FASE 2.
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="cta">CTA</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Input</h2>
        <Input label="E-mail" type="email" placeholder="seu@email.com" />
        <Input
          label="Senha"
          type="password"
          error="Informe uma senha válida."
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Badge e Avatar</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Confirmado</Badge>
          <Badge variant="accent">Ativo</Badge>
          <Badge variant="success">2 vagas</Badge>
          <Badge variant="warning">1 vaga</Badge>
          <Badge variant="danger">Lotado</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Avatar alt="Usuário" fallback="JE" />
          <Avatar alt="Usuário sem foto" />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Overlay e Toast</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(true)}>
            Abrir sheet
          </Button>
          <Button variant="cta" onClick={() => toast('Toast de exemplo')}>
            Disparar toast
          </Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="Modal"
        onClose={() => setModalOpen(false)}
      >
        <p className="text-muted-foreground">
          Feche pelo backdrop, pelo X ou com Escape.
        </p>
      </Modal>

      <BottomSheet
        open={sheetOpen}
        title="Bottom sheet"
        onClose={() => setSheetOpen(false)}
      >
        <p className="text-muted-foreground">
          No mobile sobe de baixo. Em sm+ fica centrado.
        </p>
      </BottomSheet>
    </main>
  );
}
