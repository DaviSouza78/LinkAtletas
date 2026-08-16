import { useState } from 'react'
import { Bell, ChevronRight, CreditCard, FileText, HeartPulse, LockKeyhole, LogOut, MapPin, Pencil, ShieldCheck, Target, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, Badge, Progress, Toast } from '../../components/Ui'

export function AthleteProfilePage() {
  const { logout } = useAuth(); const [toast, setToast] = useState(false)
  const items = [
    { icon: UserRound, title: 'Dados pessoais', text: 'Nome, e-mail e telefone' },
    { icon: Target, title: 'Perfil esportivo', text: 'Objetivo, nível e disponibilidade' },
    { icon: HeartPulse, title: 'Saúde e segurança', text: 'Condições, restrições e contato de emergência' },
    { icon: CreditCard, title: 'Assinatura e pagamentos', text: 'Plano Performance · em dia' },
    { icon: Bell, title: 'Notificações', text: 'Treinos, mensagens e lembretes' },
    { icon: LockKeyhole, title: 'Privacidade e dados', text: 'Consentimentos, exportação e exclusão' },
  ]
  return <div className="athlete-profile"><article className="athlete-profile__hero"><div className="athlete-profile__avatar"><Avatar initials="MC" color="#74d6d1" size="xl" /><button onClick={() => setToast(true)}><Pencil /></button></div><div><h2>Marina Costa</h2><p>Atleta de corrida · Intermediário</p><span><MapPin /> Joinville, SC</span></div><Badge tone="success"><ShieldCheck /> Perfil completo</Badge></article>
    <section className="athlete-profile__progress"><div><span>Seu perfil esportivo</span><strong>88%</strong></div><Progress value={88} tone="cyan" /><p>Complete suas informações de saúde para recomendações ainda mais seguras.</p></section>
    <section className="settings-list">{items.map(({ icon: Icon, title, text }) => <button key={title} onClick={() => setToast(true)}><span><Icon /></span><div><strong>{title}</strong><small>{text}</small></div><ChevronRight /></button>)}</section>
    <section className="privacy-note"><ShieldCheck /><div><strong>Seus dados pertencem a você</strong><p>A LinkAtletas aplica minimização, transparência e controle de acesso conforme a LGPD. Você pode revisar consentimentos ou solicitar uma cópia a qualquer momento.</p><button onClick={() => setToast(true)}><FileText /> Ver central de privacidade</button></div></section>
    <button className="logout-button" onClick={logout}><LogOut /> Sair da conta</button><Toast message="Configuração atualizada." visible={toast} onClose={() => setToast(false)} />
  </div>
}
