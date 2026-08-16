import { useState } from 'react'
import { CheckCheck, MoreHorizontal, Paperclip, Search, Send, Smile, Video } from 'lucide-react'
import { athletes } from '../../data/mock'
import { Avatar } from '../../components/Ui'

const conversations = [
  { ...athletes[0], preview: 'Finalizei! Ritmo ficou bem estável.', time: '09:42', unread: 2 },
  { ...athletes[1], preview: 'Senti um desconforto leve no joelho...', time: 'Ontem', unread: 1 },
  { ...athletes[2], preview: 'Enviei o vídeo do agachamento.', time: 'Ontem', unread: 0 },
  { ...athletes[3], preview: 'Perfeito, obrigado pelas correções!', time: 'Sex', unread: 0 },
]

export function MessagesPage({ role }: { role: 'coach' | 'athlete' }) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const selected = role === 'coach' ? conversations[0] : { name: 'André Martins', initials: 'AM', color: '#d7f266', sport: 'Treinador de endurance' }
  function send() { if (message.trim()) { setSent([...sent, message.trim()]); setMessage('') } }
  return <div className="messages-layout">
    <aside className="conversation-panel"><div className="conversation-search"><Search /><input placeholder="Buscar conversa" /></div><div className="conversation-list">{(role === 'coach' ? conversations : [selected]).map((c, i) => <button className={`conversation-item ${i === 0 ? 'active' : ''}`} key={c.name}><Avatar initials={c.initials} color={c.color} /><div><strong>{c.name}</strong><span>{'preview' in c ? c.preview : 'Seu treinador'}</span></div>{'time' in c && <small>{c.time}</small>}{'unread' in c && c.unread > 0 && <b>{c.unread}</b>}</button>)}</div></aside>
    <section className="chat-panel"><header><Avatar initials={selected.initials} color={selected.color} /><div><strong>{selected.name}</strong><span><i /> Online agora · {selected.sport}</span></div><button className="icon-button"><Video /></button><button className="icon-button"><MoreHorizontal /></button></header><div className="chat-body"><span className="day-divider">Hoje</span>
      {role === 'coach' ? <><div className="bubble bubble--incoming"><p>Bom dia, André! Finalizei o intervalado. Consegui manter todos entre 4:48 e 4:55/km.</p><small>09:40</small></div><div className="workout-message"><div><strong>Intervalado 6 × 800 m</strong><span>Concluído · 52 min · Esforço 8/10</span></div><button>Ver resultado</button></div><div className="bubble bubble--incoming"><p>Ritmo ficou bem estável. Só senti pesar um pouco na última repetição.</p><small>09:42</small></div><div className="bubble bubble--outgoing"><p>Excelente controle, Marina! A consistência foi exatamente o que buscávamos. A última pode pesar mesmo — recuperação hoje e mobilidade leve.</p><small>09:47 <CheckCheck /></small></div></> : <><div className="bubble bubble--outgoing"><p>Finalizei! Ritmo ficou bem estável. Só senti pesar um pouco na última repetição.</p><small>09:42 <CheckCheck /></small></div><div className="bubble bubble--incoming"><p>Excelente controle, Marina! A consistência foi exatamente o que buscávamos. A última pode pesar mesmo — recuperação hoje e mobilidade leve.</p><small>09:47</small></div></>}
      {sent.map((text, i) => <div className="bubble bubble--outgoing" key={i}><p>{text}</p><small>Agora <CheckCheck /></small></div>)}
    </div><footer className="chat-input"><button><Paperclip /></button><input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Escreva uma mensagem..." /><button><Smile /></button><button className="send-button" onClick={send}><Send /></button></footer></section>
  </div>
}
