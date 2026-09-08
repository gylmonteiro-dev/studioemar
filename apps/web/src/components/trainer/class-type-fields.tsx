'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SelectField } from '@/components/ui/select-field';
import { useToast } from '@/components/ui/toast';
import { createClassType } from '@/lib/api';
import type { ClassType } from '@studioemar/shared';
import { useState } from 'react';

type ClassTypeFieldsProps = {
  value: string;
  types: ClassType[];
  error?: string;
  onChange: (value: string) => void;
  onCreated: (type: ClassType) => void;
};

export function ClassTypeFields({
  value,
  types,
  error,
  onChange,
  onCreated,
}: ClassTypeFieldsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const missingSelected =
    value.length > 0 && types.every((type) => type.name !== value);

  async function saveType() {
    setSaving(true);
    setFormError('');
    try {
      const created = await createClassType({ name });
      onCreated(created);
      onChange(created.name);
      setName('');
      setOpen(false);
      toast('Tipo de aula cadastrado.');
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'Não foi possível cadastrar',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <SelectField
        label="Tipo da aula"
        value={value}
        error={error}
        required
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione o tipo</option>
        {missingSelected ? <option value={value}>{value}</option> : null}
        {types.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </SelectField>
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        onClick={() => {
          setFormError('');
          setOpen(true);
        }}
      >
        Cadastrar tipo
      </Button>
      <Modal
        nested
        open={open}
        title="Cadastrar tipo de aula"
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            O nome será gravado em maiúsculas e não pode repetir um tipo já
            cadastrado.
          </p>
          <Input
            label="Nome do tipo"
            placeholder="Ex.: Funcional"
            value={name}
            error={formError}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                if (!saving && name.trim().length > 0) {
                  void saveType();
                }
              }
            }}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="cta"
              className="flex-1"
              disabled={saving || name.trim().length === 0}
              onClick={() => void saveType()}
            >
              Salvar tipo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
