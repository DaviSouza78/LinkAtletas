import { useState } from 'react'
import { Activity, CalendarDays, Check, ChevronDown, Clock3, Dumbbell, HeartPulse, Play, Upload, Video } from 'lucide-react'
import { Badge, Toast } from '../../components/Ui'

const blocks = [
  { title: 'Aquecimento', detail: '12 min · Corrida leve em Z1–Z2', done: true },
  { title: 'Educativos de corrida', detail: '3 exercícios · 2 séries', done: true },
  { title: 'Série principal', detail: '6 × 800 m · Ritmo 4:48–4:55/km', done: false },
  { title: 'Volta à calma', detail: '10 min · Trote leve + mobilidade', done: false },
]

export function AthleteTrainingPage() {
  const [done, setDone] = useState([true, true, false, false])
  const [toast, setToast] = useState(false)
  return <div className="athlete-training"><section className="training-hero"><div><Badge tone="warning">INTENSIDADE ALTA</Badge><span className="sport-label">CORRIDA</span><h2>Intervalado 6 × 800 m</h2><p>Controle o ritmo e preserve energia para fechar as duas últimas repetições com qualidade.</p><div><span><Clock3 /> 52 min</span><span><Activity /> 8,4 km</span><span><HeartPulse /> Zona 4</span></div></div><button className="training-play" onClick={() => setToast(true)}><Play fill="currentColor" /></button></section>
    <section className="athlete-training-grid"><article className="athlete-card"><div className="athlete-card__head"><div><span className="eyebrow">Estrutura</span><h3>Blocos do treino</h3></div><span className="completion-count">{done.filter(Boolean).length}/4</span></div><div className="training-blocks">{blocks.map((block, i) => <button className={done[i] ? 'done' : ''} key={block.title} onClick={() => setDone(done.map((v, x) => x === i ? !v : v))}><span>{done[i] ? <Check /> : i + 1}</span><div><strong>{block.title}</strong><small>{block.detail}</small></div><ChevronDown /></button>)}</div></article><article className="athlete-card orientation-card"><div className="athlete-card__head"><div><span className="eyebrow">Orientação</span><h3>Vídeo do treinador</h3></div><Video /></div><div className="video-placeholder"><button onClick={() => setToast(true)}><Play fill="currentColor" /></button><span>02:14</span></div><p>André explica como distribuir o esforço e controlar a recuperação entre as séries.</p></article></section>
    <section className="athlete-card feedback-form"><div><span className="eyebrow">Depois do treino</span><h3>Conte como foi sua experiência</h3><p>Seu feedback ajuda o treinador a ajustar os próximos estímulos.</p></div><div className="effort-scale"><span>Esforço percebido</span><div>{[1,2,3,4,5,6,7,8,9,10].map(n => <button className={n === 8 ? 'active' : ''} key={n}>{n}</button>)}</div><small><span>Leve</span><span>Máximo</span></small></div><label>Observações<textarea placeholder="Como você se sentiu durante o treino?" /></label><button className="upload-box" onClick={() => setToast(true)}><Upload /><div><strong>Enviar vídeo da execução</strong><span>MP4, MOV ou AVI · até 500 MB</span></div></button><button className="button button--dark" onClick={() => setToast(true)}>Finalizar e enviar feedback</button></section>
    <Toast message="Feedback salvo e enviado ao treinador." visible={toast} onClose={() => setToast(false)} />
  </div>
}
