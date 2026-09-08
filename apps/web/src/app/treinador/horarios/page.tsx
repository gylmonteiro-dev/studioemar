import { redirect } from 'next/navigation';

export default function HorariosRedirectPage() {
  redirect('/treinador/configuracoes?secao=horarios');
}
