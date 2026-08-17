import { useState, useRef, useEffect } from 'react'
import {
  CheckCheck, ChevronRight, Dumbbell, MoreHorizontal, Paperclip,
  Phone, Play, Search, Send, ShieldCheck, Smile, UserRound, Video, X
} from 'lucide-react'
import { athletes, initialConversationsData, workoutDetails } from '../../data/mock'
import { Avatar, Badge, WorkoutDetailModal, VideoReviewModal, StudentDetailModal } from '../../components/Ui'
import type { ChatMessage, Athlete, WorkoutDetail } from '../../types'

interface ConversationItem {
  id: number
  athlete: Athlete
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

const defaultConversations: ConversationItem[] = [
  { id: 1, athlete: athletes[0], lastMessage: 'Finalizei! Ritmo ficou bem estável.', time: '09:42', unread: 2, online: true },
  { id: 2, athlete: athletes[1], lastMessage: 'Senti um desconforto leve no joelho...', time: 'Ontem', unread: 1, online: true },
  { id: 3, athlete: athletes[2], lastMessage: 'Enviei o vídeo do agachamento.', time: 'Ontem', unread: 0, online: false },
  { id: 4, athlete: athletes[3], lastMessage: 'Perfeito, obrigado pelas correções!', time: 'Sex', unread: 0, online: false },
  { id: 5, athlete: athletes[4], lastMessage: 'Muito animada para começar os treinos!', time: 'Ontem', unread: 0, online: true },
]

export function MessagesPage({ role }: { role: 'coach' | 'athlete' }) {
  const [conversations, setConversations] = useState<ConversationItem[]>(defaultConversations)
  const [selectedId, setSelectedId] = useState<number>(1)
  const [messagesState, setMessagesState] = useState<Record<number, ChatMessage[]>>(initialConversationsData)
  const [inputMessage, setInputMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)

  // Modals
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [studentModalAthlete, setStudentModalAthlete] = useState<Athlete | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === selectedId) || conversations[0]
  const currentMessages = messagesState[selectedId] || []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, isTyping])

  function handleSelectConversation(id: number) {
    setSelectedId(id)
    // Mark as read
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  function handleSendMessage(customText?: string) {
    const textToSend = customText || inputMessage.trim()
    if (!textToSend) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: role === 'coach' ? 'coach' : 'athlete',
      senderName: role === 'coach' ? 'André Martins' : activeConv.athlete.name,
      text: textToSend,
      time: timeStr,
      date: 'Hoje',
      read: true,
    }

    setMessagesState(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }))

    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, lastMessage: textToSend, time: timeStr } : c))
    setInputMessage('')
    setShowEmojiPicker(false)
    setShowAttachments(false)

    // Simulate smart, dynamic interactive reply from interlocutor after 1.2s
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const replyTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes() + 1).padStart(2, '0')}`

      let replyText = 'Perfeito! Anotei aqui e vou seguir as orientações.'
      if (role === 'coach') {
        if (selectedId === 1) replyText = 'Excelente, professor! Já fiz a hidratação e amanhã farei o regenerativo.'
        else if (selectedId === 2) replyText = 'Obrigado pelo suporte rápido, André. Vou colocar gelo e monitorar.'
        else if (selectedId === 3) replyText = 'Show! Vou focar nesses pontos na próxima sessão.'
        else replyText = 'Combinado! Obrigado pelo feedback.'
      } else {
        replyText = 'Ótimo controle! Mantenha esse foco e lembre-se de respeitar os intervalos de descanso.'
      }

      const autoReply: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: role === 'coach' ? 'athlete' : 'coach',
        senderName: role === 'coach' ? activeConv.athlete.name : 'André Martins',
        text: replyText,
        time: replyTime,
        date: 'Hoje',
        read: true,
      }

      setMessagesState(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), autoReply],
      }))

      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, lastMessage: replyText, time: replyTime } : c))
    }, 1300)
  }

  const quickReplies = role === 'coach'
    ? ['Excelente consistência! 💪', 'Como sentiu a musculatura?', 'Amanhã faremos regenerativo 💧', 'Ritmo perfeito! ⏱️']
    : ['Finalizei o treino de hoje! 🏃‍♀️', 'Senti a última série pesada 💦', 'Vídeo da execução enviado 📹', 'Dúvida sobre a hidratação 🥤']

  const emojis = ['🏃‍♂️', '💪', '🔥', '⏱️', '🎯', '👏', '🥤', '✅', '❤️', '👍']

  const filteredConversations = conversations.filter(c =>
    c.athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.athlete.sport.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="messages-layout">
      {/* Sidebar: Conversation List */}
      <aside className="conversation-panel">
        <div className="conversation-search">
          <Search size={16} />
          <input
            placeholder="Buscar conversa ou atleta..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conversation-list">
          {role === 'coach' ? (
            filteredConversations.map(c => {
              const isSelected = c.id === selectedId
              return (
                <button
                  className={`conversation-item ${isSelected ? 'active' : ''}`}
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                >
                  <div className="conv-avatar-wrap">
                    <Avatar initials={c.athlete.initials} color={c.athlete.color} />
                    {c.online && <span className="online-badge" />}
                  </div>
                  <div className="conv-text">
                    <div className="conv-top-row">
                      <strong>{c.athlete.name}</strong>
                      <small>{c.time}</small>
                    </div>
                    <span>{c.lastMessage}</span>
                  </div>
                  {c.unread > 0 && <b className="unread-counter">{c.unread}</b>}
                </button>
              )
            })
          ) : (
            <button className="conversation-item active">
              <div className="conv-avatar-wrap">
                <Avatar initials="AM" color="#d7f266" />
                <span className="online-badge" />
              </div>
              <div className="conv-text">
                <div className="conv-top-row">
                  <strong>André Martins</strong>
                  <small>09:47</small>
                </div>
                <span>Seu treinador de endurance</span>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="chat-panel">
        <header className="chat-header">
          <div
            className="chat-recipient-info"
            onClick={() => role === 'coach' && setStudentModalAthlete(activeConv.athlete)}
            title="Clique para ver a ficha completa"
          >
            <div className="conv-avatar-wrap">
              <Avatar
                initials={role === 'coach' ? activeConv.athlete.initials : 'AM'}
                color={role === 'coach' ? activeConv.athlete.color : '#d7f266'}
              />
              <span className="online-badge" />
            </div>
            <div>
              <strong>{role === 'coach' ? activeConv.athlete.name : 'André Martins'}</strong>
              <span>
                <i className="status-dot" /> Online agora · {role === 'coach' ? activeConv.athlete.sport : 'Treinador de Endurance'}
              </span>
            </div>
          </div>

          <div className="chat-header-actions">
            {role === 'coach' && (
              <button
                className="icon-button"
                onClick={() => setStudentModalAthlete(activeConv.athlete)}
                title="Ficha do atleta"
              >
                <UserRound size={18} />
              </button>
            )}
            <button
              className="icon-button"
              onClick={() => alert('Iniciando sala de videochamada Google Meet com o atleta...')}
              title="Iniciar Videochamada"
            >
              <Video size={18} />
            </button>
            <button className="icon-button" aria-label="Mais opções">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="chat-body">
          <span className="day-divider">Hoje</span>

          {currentMessages.map(msg => {
            const isOutgoing = (role === 'coach' && msg.sender === 'coach') || (role === 'athlete' && msg.sender === 'athlete')

            return (
              <div key={msg.id} className="message-row">
                {/* Workout Card Message */}
                {msg.workoutCard && (
                  <div className="workout-message">
                    <div className="workout-message__icon">
                      <Dumbbell size={20} />
                    </div>
                    <div className="workout-message__info">
                      <strong>{msg.workoutCard.title}</strong>
                      <span>{msg.workoutCard.meta}</span>
                    </div>
                    <button
                      className="workout-message__btn"
                      onClick={() => setSelectedWorkout(workoutDetails[msg.workoutCard?.workoutId || 1])}
                    >
                      Ver resultado
                    </button>
                  </div>
                )}

                {/* Video Card Message */}
                {msg.videoCard && (
                  <div className="video-card-bubble" onClick={() => setVideoModalOpen(true)}>
                    <div className="video-thumb-preview">
                      <Play size={20} fill="#fff" color="#fff" />
                      <span>{msg.videoCard.duration}</span>
                    </div>
                    <div className="video-card-meta">
                      <strong>{msg.videoCard.title}</strong>
                      <small>{msg.videoCard.notes}</small>
                    </div>
                  </div>
                )}

                {/* Audio Card Message */}
                {msg.audioCard && (
                  <div className={`bubble ${isOutgoing ? 'bubble--outgoing' : 'bubble--incoming'} bubble--audio`}>
                    <button className="audio-play-btn"><Play size={14} fill="currentColor" /></button>
                    <div className="audio-waveform">
                      <span style={{ height: '40%' }} /><span style={{ height: '70%' }} /><span style={{ height: '100%' }} />
                      <span style={{ height: '60%' }} /><span style={{ height: '80%' }} /><span style={{ height: '45%' }} />
                      <span style={{ height: '90%' }} /><span style={{ height: '35%' }} />
                    </div>
                    <small>{msg.audioCard.duration}</small>
                  </div>
                )}

                {/* Text Bubble */}
                {msg.text && (
                  <div className={`bubble ${isOutgoing ? 'bubble--outgoing' : 'bubble--incoming'}`}>
                    <p>{msg.text}</p>
                    <small>
                      {msg.time} {isOutgoing && <CheckCheck size={14} className="check-done" />}
                    </small>
                  </div>
                )}
              </div>
            )
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="typing-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="chat-quick-replies">
          {quickReplies.map(chip => (
            <button
              key={chip}
              className="quick-chip"
              onClick={() => handleSendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Emoji Bar if opened */}
        {showEmojiPicker && (
          <div className="quick-emoji-bar">
            {emojis.map(e => (
              <button
                key={e}
                className="emoji-btn"
                onClick={() => { setInputMessage(prev => prev + e); setShowEmojiPicker(false) }}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Attachment menu if opened */}
        {showAttachments && (
          <div className="attachments-menu">
            <button onClick={() => { setSelectedWorkout(workoutDetails[1]); setShowAttachments(false) }}>
              <Dumbbell size={16} /> Anexar Treino Concluído
            </button>
            <button onClick={() => { setVideoModalOpen(true); setShowAttachments(false) }}>
              <Video size={16} /> Enviar Vídeo de Execução
            </button>
          </div>
        )}

        {/* Footer Input */}
        <footer className="chat-input">
          <button
            type="button"
            className="input-tool-btn"
            onClick={() => setShowAttachments(!showAttachments)}
            title="Anexar arquivos ou treinos"
          >
            <Paperclip size={19} />
          </button>

          <input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escreva uma mensagem..."
          />

          <button
            type="button"
            className="input-tool-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Inserir emoji"
          >
            <Smile size={19} />
          </button>

          <button
            type="button"
            className="send-button"
            onClick={() => handleSendMessage()}
            aria-label="Enviar mensagem"
          >
            <Send size={18} />
          </button>
        </footer>
      </section>

      {/* Modals */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        isOpen={Boolean(selectedWorkout)}
        onClose={() => setSelectedWorkout(null)}
      />

      <VideoReviewModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        athleteName={activeConv.athlete.name}
        exerciseTitle="Execução técnica"
      />

      <StudentDetailModal
        athlete={studentModalAthlete}
        isOpen={Boolean(studentModalAthlete)}
        onClose={() => setStudentModalAthlete(null)}
      />
    </div>
  )
}
