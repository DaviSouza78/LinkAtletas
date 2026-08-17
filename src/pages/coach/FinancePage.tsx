import { useState } from 'react'
import {
  ArrowUpRight, Building, CalendarDays, CheckCircle2, CreditCard,
  Download, MoreHorizontal, ShieldCheck, WalletCards, X
} from 'lucide-react'
import { Avatar, Badge, SectionHeading, Modal, Toast } from '../../components/Ui'
import { RevenueBarChart } from '../../components/Charts'
import { athletes, revenueData } from '../../data/mock'

export function FinancePage() {
  const [period, setPeriod] = useState('6')
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const sixMonthsData = revenueData
  const twelveMonthsData = [7200, 7800, 8100, 8000, 8300, 8600, 8400, 9200, 8950, 10100, 10600, 11320]
  const months12 = ['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago']

  const activeData = period === '12' ? twelveMonthsData : sixMonthsData
  const activeMonths = period === '12' ? months12 : ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago']

  function handleExportCSV() {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Aluno,Plano,Data,Valor Bruto,Taxa Plataforma (8%),Valor Liquido,Status\n' +
      athletes.slice(0, 5).map((a, i) => {
        const gross = i === 1 ? 249 : i === 3 ? 169 : 189
        const fee = (gross * 0.08).toFixed(2)
        const net = (gross * 0.92).toFixed(2)
        const status = i === 3 ? 'Pendente' : 'Pago'
        return `"${a.name}","${a.plan}","${12 - i}/08/2026",R$ ${gross},R$ ${fee},R$ ${net},"${status}"`
      }).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'relatorio_financeiro_linkatletas_agosto.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setToastMessage('Relatório financeiro exportado com sucesso (.CSV)!')
  }

  return (
    <div>
      {/* Finance Stats KPI Grid */}
      <section className="stat-grid finance-stats">
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--lime"><WalletCards /></span>
          <div>
            <small>Receita líquida em agosto</small>
            <strong>R$ 11.320</strong>
            <span className="trend trend--up"><ArrowUpRight /> 8,4% <i>vs. julho</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--cyan"><CreditCard /></span>
          <div>
            <small>Receita recorrente</small>
            <strong>R$ 10.870</strong>
            <span className="trend"><i>96% do total</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--orange"><CalendarDays /></span>
          <div>
            <small>Próximo repasse</small>
            <strong>R$ 4.280</strong>
            <span className="trend"><i>20 de agosto</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--purple"><CheckCircle2 /></span>
          <div>
            <small>Pagamentos em dia</small>
            <strong>27/28</strong>
            <span className="trend"><i>1 pendência</i></span>
          </div>
        </article>
      </section>

      {/* Revenue Chart and Payout Card */}
      <section className="dashboard-grid dashboard-grid--finance">
        <article className="panel revenue-chart">
          <div className="panel__head">
            <div>
              <h3>Evolução da receita</h3>
              <p>Valores líquidos recebidos após dedução da taxa de 8% da plataforma</p>
            </div>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              aria-label="Filtrar período da receita"
            >
              <option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
            </select>
          </div>

          <RevenueBarChart data={activeData} months={activeMonths} />
        </article>

        <article className="panel payout-card">
          <span className="payout-card__icon"><WalletCards size={24} /></span>
          <small>Saldo disponível para saque</small>
          <strong>R$ 4.280,00</strong>
          <p>Repasse automático programado para 20/08 via Pix</p>
          <button
            className="button button--dark"
            onClick={() => setBankModalOpen(true)}
          >
            Ver dados bancários
          </button>
          <div className="payout-meta-row">
            <span>Taxa LinkAtletas</span>
            <b>8% (split automático)</b>
          </div>
          <div className="payout-meta-row">
            <span>Último repasse liquidado</span>
            <b>R$ 3.960,00 (05/08)</b>
          </div>
        </article>
      </section>

      {/* Recent Transactions Table */}
      <section className="panel">
        <SectionHeading
          title="Transações recentes"
          description="Mensalidades, consultorias e repasses automáticos de agosto de 2026"
          action={
            <button className="button button--outline" onClick={handleExportCSV}>
              <Download size={16} /> Exportar CSV
            </button>
          }
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Valor bruto</th>
                <th>Taxa (8%)</th>
                <th>Líquido</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {athletes.slice(0, 5).map((a, i) => (
                <tr key={a.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar initials={a.initials} color={a.color} />
                      <strong>{a.name}</strong>
                    </div>
                  </td>
                  <td>Mensalidade · {a.plan}</td>
                  <td>{12 - i}/08/2026</td>
                  <td>R$ {i === 1 ? '249,00' : i === 3 ? '169,00' : '189,00'}</td>
                  <td className="muted">- R$ {(i === 1 ? 19.92 : i === 3 ? 13.52 : 15.12).toFixed(2).replace('.', ',')}</td>
                  <td>
                    <b>R$ {(i === 1 ? 229.08 : i === 3 ? 155.48 : 173.88).toFixed(2).replace('.', ',')}</b>
                  </td>
                  <td>
                    <Badge tone={i === 3 ? 'warning' : 'success'}>
                      {i === 3 ? 'Pendente' : 'Pago'}
                    </Badge>
                  </td>
                  <td>
                    <button className="icon-button" aria-label="Mais opções da transação">
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Banking Details Modal */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Dados Bancários e Repasses"
        subtitle="Conta cadastrada para recebimento automático"
      >
        <div className="banking-modal-body">
          <div className="bank-card-preview">
            <Building size={24} />
            <div>
              <strong>Banco Inter (077)</strong>
              <span>Agência: 0001 · Conta Corrente: 8941203-5</span>
              <small>Chave Pix: 012.345.678-90 (CPF)</small>
            </div>
            <Badge tone="success"><ShieldCheck size={14} /> Conta verificada</Badge>
          </div>

          <p className="banking-note">
            Os repasses são creditados automaticamente nos dias 05 e 20 de cada mês, sem cobrança de TED ou taxa de transferência.
          </p>

          <div className="modal-actions-footer">
            <button className="button button--outline" onClick={() => setBankModalOpen(false)}>
              Fechar
            </button>
            <button
              className="button button--accent"
              onClick={() => {
                setBankModalOpen(false)
                setToastMessage('Solicitação de alteração bancária enviada para análise.')
              }}
            >
              Alterar chave Pix
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
