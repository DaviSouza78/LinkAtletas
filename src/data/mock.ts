import type { Athlete, Coach, Training } from '../types'

export const athletes: Athlete[] = [
  { id: 1, name: 'Marina Costa', email: 'emailatleta@email.com', initials: 'MC', sport: 'Corrida', goal: 'Meia maratona sub 1h50', plan: 'Performance', progress: 78, compliance: 92, lastActivity: 'Hoje, 07:14', nextWorkout: 'Intervalado • amanhã', status: 'active', color: '#d7f266' },
  { id: 2, name: 'Rafael Nunes', email: 'rafael.nunes@exemplo.com', initials: 'RN', sport: 'Triatlo', goal: 'Ironman 70.3', plan: 'Elite', progress: 64, compliance: 86, lastActivity: 'Ontem, 18:40', nextWorkout: 'Ciclismo Z2 • hoje', status: 'attention', color: '#74d6d1' },
  { id: 3, name: 'Camila Rocha', email: 'camila.rocha@exemplo.com', initials: 'CR', sport: 'Musculação', goal: 'Ganho de força', plan: 'Performance', progress: 82, compliance: 96, lastActivity: 'Hoje, 06:32', nextWorkout: 'Inferiores A • amanhã', status: 'active', color: '#f5b97e' },
  { id: 4, name: 'Diego Martins', email: 'diego.martins@exemplo.com', initials: 'DM', sport: 'Natação', goal: '1.500 m em 22 min', plan: 'Essencial', progress: 55, compliance: 72, lastActivity: 'Há 3 dias', nextWorkout: 'Técnica • hoje', status: 'attention', color: '#aebbf8' },
  { id: 5, name: 'Beatriz Lima', email: 'beatriz.lima@exemplo.com', initials: 'BL', sport: 'Corrida', goal: 'Primeiros 10 km', plan: 'Essencial', progress: 31, compliance: 89, lastActivity: 'Ontem, 07:50', nextWorkout: 'Rodagem leve • amanhã', status: 'new', color: '#e8a6cb' },
  { id: 6, name: 'Lucas Ferreira', email: 'lucas.ferreira@exemplo.com', initials: 'LF', sport: 'Ciclismo', goal: 'Gran Fondo 2026', plan: 'Performance', progress: 70, compliance: 91, lastActivity: 'Hoje, 05:58', nextWorkout: 'Sweet spot • sexta', status: 'active', color: '#9ed790' },
]

export const coaches: Coach[] = [
  { id: 1, name: 'André Martins', initials: 'AM', specialty: 'Corrida e endurance', sports: ['Corrida', 'Triatlo'], rating: 4.9, reviews: 126, price: 189, match: 96, location: 'Florianópolis, SC', mode: 'Online e híbrido', verified: true, color: '#d7f266', bio: 'Especialista em endurance e planejamento para provas de 5 km à maratona, com 11 anos de experiência.' },
  { id: 2, name: 'Paula Siqueira', initials: 'PS', specialty: 'Força e condicionamento', sports: ['Musculação', 'Cross training'], rating: 4.9, reviews: 89, price: 219, match: 92, location: 'São Paulo, SP', mode: '100% online', verified: true, color: '#74d6d1', bio: 'Treinamento de força baseado em evidências, com foco em performance, saúde e prevenção de lesões.' },
  { id: 3, name: 'Bruno Almeida', initials: 'BA', specialty: 'Triatlo e ciclismo', sports: ['Triatlo', 'Ciclismo'], rating: 4.8, reviews: 74, price: 249, match: 88, location: 'Curitiba, PR', mode: 'Online e presencial', verified: true, color: '#f5b97e', bio: 'Treinador de triatlo com experiência em provas de longa distância e controle individualizado de carga.' },
  { id: 4, name: 'Lívia Torres', initials: 'LT', specialty: 'Natação', sports: ['Natação', 'Águas abertas'], rating: 4.7, reviews: 53, price: 169, match: 84, location: 'Rio de Janeiro, RJ', mode: 'Online e híbrido', verified: true, color: '#aebbf8', bio: 'Técnica de natação para adultos, águas abertas e eficiência de nado com análise detalhada em vídeo.' },
]

export const trainings: Training[] = [
  { id: 1, title: 'Intervalado 6 × 800 m', athlete: 'Marina Costa', sport: 'Corrida', date: 'Hoje, 07:00', duration: '52 min', intensity: 'Alta', status: 'Concluído', exercises: 4 },
  { id: 2, title: 'Base aeróbica Z2', athlete: 'Rafael Nunes', sport: 'Ciclismo', date: 'Hoje, 18:30', duration: '1h 25 min', intensity: 'Moderada', status: 'Programado', exercises: 3 },
  { id: 3, title: 'Inferiores — força máxima', athlete: 'Camila Rocha', sport: 'Musculação', date: 'Amanhã, 06:30', duration: '65 min', intensity: 'Alta', status: 'Programado', exercises: 7 },
  { id: 4, title: 'Técnica e eficiência', athlete: 'Diego Martins', sport: 'Natação', date: 'Amanhã, 19:00', duration: '50 min', intensity: 'Leve', status: 'Programado', exercises: 5 },
  { id: 5, title: 'Rodagem progressiva', athlete: 'Beatriz Lima', sport: 'Corrida', date: 'Qui, 07:00', duration: '45 min', intensity: 'Moderada', status: 'Programado', exercises: 3 },
]

export const weeklyLoad = [42, 58, 54, 69, 76, 73, 88]
export const revenueData = [8400, 9200, 8950, 10100, 10600, 11320]
export const complianceData = [82, 88, 84, 91, 89, 93, 92]
