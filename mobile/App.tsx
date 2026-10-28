import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import type { AppUser } from '../shared/contracts'
import {
  api,
  loadSession,
  forgetSession,
  logout,
  onSessionExpired,
  API_CONFIGURATION_ERROR,
  LOCAL_DEMO,
} from './src/services/api'
import { AuthScreen } from './src/screens/auth/AuthScreen'
import { HomeScreen } from './src/screens/home/HomeScreen'
import { ConnectionsScreen } from './src/screens/connections/ConnectionsScreen'
import { DiscoverScreen } from './src/screens/connections/DiscoverScreen'
import { ProfileScreen } from './src/screens/profile/ProfileScreen'
import { WorkoutsScreen } from './src/screens/workouts/WorkoutsScreen'
import { ChatScreen } from './src/screens/messages/ChatScreen'
import { AgendaScreen } from './src/screens/agenda/AgendaScreen'
import { ReviewsScreen } from './src/screens/reviews/ReviewsScreen'
import { NotificationsScreen } from './src/screens/notifications/NotificationsScreen'
import { FinanceScreen } from './src/screens/billing/FinanceScreen'
import { PrivacyScreen } from './src/screens/privacy/PrivacyScreen'
import { Body, Button, Loading, colors } from './src/components/ui'
import { SessionContext } from './src/context/SessionContext'
import {
  navigation,
  canNavigate,
  validRole,
  type Destination,
} from './src/navigation/access'
import { AdminHomeScreen } from './src/screens/admin/AdminHomeScreen'
import { AdminVerificationScreen } from './src/screens/admin/AdminVerificationScreen'
import { AdminReviewsScreen } from './src/screens/admin/AdminReviewsScreen'
import { AdminBillingScreen } from './src/screens/admin/AdminBillingScreen'
import { AdminPrivacyScreen } from './src/screens/admin/AdminPrivacyScreen'
import { CoachWorkoutsScreen } from './src/screens/workouts/CoachWorkoutsScreen'

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null),
    [initializing, setInitializing] = useState(true),
    [tab, setTab] = useState<Destination>('Início')
  const [sessionNotice, setSessionNotice] = useState(API_CONFIGURATION_ERROR)
  useEffect(() => {
    const dispose = onSessionExpired(() => {
      setUser(null)
      setTab('Início')
      setSessionNotice('Sua sessão encerrou. Entre novamente.')
    })
    loadSession()
      .then(async (token) => {
        if (!token) return
        const { user: account } = await api<{ user: AppUser | null }>(
          '/auth/session',
        )
        if (account && validRole(account.role)) setUser(account)
        else await forgetSession()
      })
      .catch(() => {
        setSessionNotice(
          'Não foi possível validar a sessão. Confira a API e entre novamente.',
        )
      })
      .finally(() => setInitializing(false))
    return dispose
  }, [])
  const signOut = async () => {
    await logout().catch(() => undefined)
    setUser(null)
    setTab('Início')
  }
  function content() {
    if (!user)
      return (
        <AuthScreen
          notice={sessionNotice}
          onAuthenticated={(account) => {
            setUser(account)
            setTab('Início')
            setSessionNotice('')
          }}
        />
      )
    const navigate = (target: string) => {
      if (canNavigate(user.role, target)) setTab(target)
    }
    const destination = canNavigate(user.role, tab) ? tab : 'Início'
    switch (destination) {
      case 'Início':
        return user.role === 'admin' ? (
          <AdminHomeScreen navigate={navigate} />
        ) : (
          <HomeScreen name={user.name} navigate={navigate} />
        )
      case 'Treinos':
        return user.role === 'coach' ? (
          <CoachWorkoutsScreen />
        ) : (
          <WorkoutsScreen />
        )
      case 'Buscar':
        return <DiscoverScreen />
      case 'Vínculos':
        return <ConnectionsScreen />
      case 'Mensagens':
        return <ChatScreen userId={user.id} />
      case 'Agenda':
        return <AgendaScreen />
      case 'Avaliações':
        return <ReviewsScreen />
      case 'Financeiro':
        return <FinanceScreen />
      case 'Avisos':
        return <NotificationsScreen />
      case 'Perfil':
        return (
          <ProfileScreen onUpdated={(name) => setUser({ ...user, name })} />
        )
      case 'Privacidade':
        return (
          <PrivacyScreen
            onClosed={() => {
              setUser(null)
              setTab('Início')
            }}
          />
        )
      case 'CREF':
        return <AdminVerificationScreen />
      case 'Moderacao':
        return <AdminReviewsScreen />
      case 'Regras financeiras':
        return <AdminBillingScreen />
      case 'Pedidos de privacidade':
        return <AdminPrivacyScreen />
    }
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={layout.safe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={layout.safe}
        >
          <View style={layout.header}>
            <View>
              <Text style={layout.logo}>
                Link<Text style={layout.logoAccent}>Atletas</Text>
              </Text>
              <Body muted>
                {LOCAL_DEMO
                  ? 'Ambiente de demonstração local'
                  : user
                    ? 'Seu acompanhamento, perto de você'
                    : 'Conecte seu próximo passo'}
              </Body>
            </View>
            {user && (
              <Button title="Sair" secondary onPress={() => void signOut()} />
            )}
          </View>
          {user && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={layout.tabs}
              >
                {navigation[user.role].map((item) => (
                  <Button
                    key={item}
                    title={item}
                    secondary={tab !== item}
                    onPress={() => setTab(item)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={layout.content}
          >
            <SessionContext.Provider value={user}>
              {initializing ? <Loading /> : content()}
            </SessionContext.Provider>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
const layout = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 18,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  logo: { fontSize: 25, color: colors.text, fontWeight: '700' },
  logoAccent: { color: colors.lime },
  tabs: { gap: 8, padding: 14 },
  content: {
    padding: 18,
    paddingBottom: 42,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
})
