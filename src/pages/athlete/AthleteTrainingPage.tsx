import { useState } from 'react'
import {
  Activity, CalendarDays, Check, ChevronDown, Clock3, Dumbbell,
  HeartPulse, Play, Upload, Video, X
} from 'lucide-react'
import { Badge, Toast, Modal, VideoReviewModal } from '../../components/Ui'

const initialBlocks = [
  { title: 'Aquecimento', detail: '12 min · Corrida leve em Z1–Z2 (ritmo 6:00/km)', done: true },
  { title: 'Educativos de corrida', detail: 'Skipping alto, anfersen e hop · 2 séries', done: true },
  { title: 'Série principal', detail: '6 × 800 m · Ritmo 4:48–4:55/km com 90s trote', done: true },
  { title: 'Volta à calma', detail: '10 min · Trote regenerativo + soltura miofascial', done: false },
]

export function AthleteTrainingPage() {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [effort, setEffort] = useState(8)
  const [notes, setNotes] = useState('Ritmo bem controlado. Senti a 6ª repetição pesar um pouco, mas fechei em 4:54/km.')
  const [uploadedFile, setUploadedFile] = useState<string | null>('video_tiro_final.mp4')
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const completedCount = blocks.filter(b => b.done).length
  const progressPercent = Math.round((completedCount / blocks.length) * 100)

  function toggleBlock(index: number) {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, done: !b.done } : b))
  }

  function getEffortLabel(val: number) {
    if (val <= 2) return 'Muito leve (recuperação ativa)'
    if (val <= 4) return 'Leve a moderado (confortável)'
    if (val <= 6) return 'Moderado (zona aeróbia produtiva)'
    if (val <= 8) return 'Intenso (limiar anaeróbio Z4)'
    return 'Máximo esforço (exaustão)'
  }

  function handleSubmitFeedback() {
    setToastMessage('Feedback do treino enviado para o treinador André Martins!')
  }

  return (
    <div className="athlete-training">
      {/* Training Hero */}
      <section className="training-hero">
        <div>
          <Badge tone="warning">INTENSIDADE ALTA</Badge>
          <span className="sport-label">CORRIDA</span>
          <h2>Intervalado 6 × 800 m</h2>
          <p>Controle o ritmo nas 3 primeiras repetições e preserve energia para fechar as duas últimas com cadência acima de 178 spm.</p>
          <div className="training-hero-tags">
            <span><Clock3 size={15} /> 52 min</span>
            <span><Activity size={15} /> 8,4 km</span>
            <span><HeartPulse size={15} /> Zona 4</span>
          </div>
        </div>
        <button
          className="training-play"
          onClick={() => setVideoModalOpen(true)}
          title="Ver orientações em vídeo do treinador"
        >
          <Play size={24} fill="currentColor" />
        </button>
      </section>

      {/* Grid: Blocks & Coach Video Orientation */}
      <section className="athlete-training-grid">
        {/* Workout Blocks List */}
        <article className="athlete-card">
          <div className="athlete-card__head">
            <div>
              <span className="eyebrow">Estrutura</span>
              <h3>Blocos do treino</h3>
            </div>
            <span className="completion-count">
              {completedCount}/{blocks.length} concluídos ({progressPercent}%)
            </span>
          </div>

          <div className="training-blocks">
            {blocks.map((block, i) => (
              <button
                className={`training-block-item ${block.done ? 'done' : ''}`}
                key={block.title}
                onClick={() => toggleBlock(i)}
              >
                <span className="block-check">{block.done ? <Check size={14} /> : i + 1}</span>
                <div className="block-info">
                  <strong>{block.title}</strong>
                  <small>{block.detail}</small>
                </div>
                <ChevronDown size={16} />
              </button>
            ))}
          </div>
        </article>

        {/* Coach Video Orientation Card */}
        <article className="athlete-card orientation-card">
          <div className="athlete-card__head">
            <div>
              <span className="eyebrow">Orientação</span>
              <h3>Vídeo do treinador</h3>
            </div>
            <Video size={20} />
          </div>

          <div className="video-placeholder" onClick={() => setVideoModalOpen(true)}>
            <button aria-label="Assistir vídeo de orientação"><Play size={24} fill="currentColor" /></button>
            <span>02:14</span>
          </div>
          <p>André explica como distribuir o esforço e controlar a recuperação de 90s entre os tiros.</p>
        </article>
      </section>

      {/* Post-workout Feedback Form */}
      <section className="athlete-card feedback-form">
        <div>
          <span className="eyebrow">Depois do treino</span>
          <h3>Conte como foi sua experiência</h3>
          <p>Seu feedback ajuda o treinador a dosar a recuperação e ajustar os próximos treinos.</p>
        </div>

        {/* Interactive Effort Rating */}
        <div className="effort-scale">
          <div className="effort-scale-header">
            <span>Esforço percebido (RPE): <strong>{effort} / 10</strong></span>
            <span className="effort-tag">{getEffortLabel(effort)}</span>
          </div>
          <div className="effort-buttons-row">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                type="button"
                className={`effort-btn ${effort === n ? 'active' : ''}`}
                onClick={() => setEffort(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <small className="scale-limits">
            <span>1 (Muito leve)</span>
            <span>10 (Exaustão total)</span>
          </small>
        </div>

        {/* Notes Textarea */}
        <label className="feedback-textarea-label">
          <span>Observações e sensações</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Como você se sentiu durante o treino? Houve algum desconforto muscular ou articular?"
          />
        </label>

        {/* Upload box */}
        <div className="upload-box">
          <Upload size={22} />
          <div>
            <strong>{uploadedFile ? `Arquivo selecionado: ${uploadedFile}` : 'Enviar vídeo da execução ou arquivo GPX'}</strong>
            <span>MP4, MOV, FIT ou GPX · até 500 MB</span>
          </div>
          {uploadedFile ? (
            <button className="remove-file-btn" onClick={() => setUploadedFile(null)}>
              <X size={14} />
            </button>
          ) : (
            <button className="button button--outline" onClick={() => setUploadedFile('gravacao_treino.mp4')}>
              Selecionar
            </button>
          )}
        </div>

        <button className="button button--accent button--large" onClick={handleSubmitFeedback}>
          Finalizar e enviar feedback ao treinador <Check size={18} />
        </button>
      </section>

      <VideoReviewModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        athleteName="André Martins"
        exerciseTitle="Orientações Técnicas do Intervalado"
      />

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
