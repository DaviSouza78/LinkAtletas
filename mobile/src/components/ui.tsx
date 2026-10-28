import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export const colors = {
  background: '#061914',
  panel: '#102a22',
  border: '#29463b',
  lime: '#bafa6d',
  cyan: '#81e7df',
  text: '#f2f7f4',
  muted: '#b1c6ba',
  danger: '#ffb7ba',
}
export function Heading({
  children,
  small = false,
}: {
  children: ReactNode
  small?: boolean
}) {
  return (
    <Text
      style={small ? styles.subheading : styles.heading}
      accessibilityRole="header"
    >
      {children}
    </Text>
  )
}
export function Body({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>
}
export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>
}
export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  destructive = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
  destructive?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        destructive && styles.destructive,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryText,
          destructive && styles.destructiveText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  )
}
export function Field({
  label,
  value,
  onChange,
  secure = false,
  multiline = false,
  numeric = false,
  email = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  secure?: boolean
  multiline?: boolean
  numeric?: boolean
  email?: boolean
  hint?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={
          numeric ? 'decimal-pad' : email ? 'email-address' : 'default'
        }
        autoCapitalize={email || secure ? 'none' : 'sentences'}
        autoCorrect={!email && !secure}
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor={colors.muted}
      />
      {hint && <Body muted>{hint}</Body>}
    </View>
  )
}
export function Choices({
  label,
  options,
  selected,
  onChange,
  multiple = false,
}: {
  label: string
  options: Array<{ id: string; label: string }>
  selected: string[]
  onChange: (selected: string[]) => void
  multiple?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ checked: selected.includes(option.id) }}
            onPress={() =>
              onChange(
                multiple
                  ? selected.includes(option.id)
                    ? selected.filter((id) => id !== option.id)
                    : [...selected, option.id]
                  : [option.id],
              )
            }
            style={[
              styles.choice,
              selected.includes(option.id) && styles.selectedChoice,
            ]}
          >
            <Text
              style={[
                styles.choiceText,
                selected.includes(option.id) && styles.selectedChoiceText,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.lime} accessibilityLabel="Carregando" />
      <Body muted>Carregando seus dados…</Body>
    </View>
  )
}
export function Notice({
  message,
  error = false,
}: {
  message: string
  error?: boolean
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, error && styles.errorNotice]}
    >
      <Text style={[styles.body, error && styles.errorText]}>{message}</Text>
    </View>
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <Panel>
      <Body muted>{children}</Body>
    </Panel>
  )
}
export const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  subheading: { fontSize: 20, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 23 },
  muted: { color: colors.muted },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lime,
  },
  secondary: { backgroundColor: 'transparent', borderColor: colors.border },
  destructive: { backgroundColor: 'transparent', borderColor: colors.danger },
  buttonText: { color: '#102314', fontWeight: '700', fontSize: 15 },
  secondaryText: { color: colors.text },
  destructiveText: { color: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  field: { gap: 8, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 48,
    padding: 13,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  multiline: { minHeight: 105 },
  choice: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selectedChoice: { backgroundColor: colors.lime, borderColor: colors.lime },
  choiceText: { color: colors.text, fontSize: 14 },
  selectedChoiceText: { color: '#102314', fontWeight: '600' },
  loading: { padding: 25, gap: 12, alignItems: 'center' },
  notice: {
    padding: 15,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorNotice: { borderColor: colors.danger },
  errorText: { color: colors.danger },
})
