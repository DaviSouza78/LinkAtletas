export const statusLabel: Record<string, string> = {
  pending: 'Aguardando análise',
  active: 'Ativo',
  rejected: 'Recusado',
  approved: 'Aprovado',
  unsubmitted: 'Não enviado',
  draft: 'Rascunho',
  published: 'Publicado',
  suspended: 'Suspenso',
  cancelled: 'Encerrado',
  scheduled: 'Agendada',
  completed: 'Concluído',
  hidden: 'Oculto',
  expired: 'Expirado',
  awaiting_payment: 'Aguardando pagamento',
  regular: 'Pagamento regular',
  grace: 'Em carência',
  cancellation_requested: 'Cancelamento solicitado',
  ended: 'Encerrado',
  uncertain: 'Aguardando conciliação',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  PENDING: 'Pendente',
  REFUNDED: 'Estornado',
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={`live-badge live-badge--${status}`}>
      {statusLabel[status] || status}
    </span>
  )
}
