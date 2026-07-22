// Small shared UI kit for tool screens, styled to the PDFMergely brand.

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { brandGlow, brandGradient, palette, radius, type } from '@/lib/brand';

type IconName = keyof typeof Ionicons.glyphMap;

export function BrandButton({
  title,
  onPress,
  disabled,
  icon,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  variant?: 'primary' | 'secondary';
}) {
  const inner = (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={variant === 'primary' ? '#ffffff' : palette.foreground}
        />
      )}
      <Text style={variant === 'primary' ? styles.btnPrimaryText : styles.btnSecondaryText}>
        {title}
      </Text>
    </>
  );
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.12)', foreground: true }}
      style={({ pressed }) => [
        styles.btnShell,
        variant === 'primary' && !disabled && styles.btnGlow,
        variant === 'secondary' && styles.btnSecondary,
        disabled && styles.btnDisabled,
        pressed && styles.pressed,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[...brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btnGradient}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={styles.btnGradient}>{inner}</View>
      )}
    </Pressable>
  );
}

/** Square icon button with a comfortable 44pt touch target. */
export function IconButton({
  icon,
  onPress,
  disabled,
  tint = palette.foreground,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  tint?: string;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.08)', foreground: true }}
      style={({ pressed }) => [styles.iconBtn, disabled && styles.btnDisabled, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color={tint} />
    </Pressable>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor={palette.muted} {...props} style={[styles.input, props.style]} />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onChange(o.id)}
          accessibilityRole="radio"
          accessibilityLabel={o.label}
          accessibilityState={{ checked: value === o.id }}
          style={[styles.segItem, value === o.id && styles.segItemActive]}
        >
          <Text style={[styles.segText, value === o.id && styles.segTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PrivacyBadge() {
  return (
    <View style={styles.privacyRow}>
      <View style={styles.privacyChip}>
        <Ionicons name="shield-checkmark" size={12} color={palette.brand} />
        <Text style={styles.privacy}>On-device only · No upload · Free</Text>
      </View>
    </View>
  );
}

export function BusyNote({ text }: { text: string }) {
  return (
    <View style={styles.busyBox}>
      <ActivityIndicator color={palette.brand} />
      <Text style={styles.busyText}>{text}</Text>
    </View>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={16} color={palette.danger} />
      <Text style={styles.error}>{text}</Text>
    </View>
  );
}

/** Success card shown after a tool finishes, mirroring the web DownloadCard. */
export function SuccessCard({
  filename,
  sizeLabel,
  onShareAgain,
  onReset,
}: {
  filename: string;
  sizeLabel: string;
  onShareAgain: () => void;
  onReset: () => void;
}) {
  // One success buzz when the card appears.
  React.useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  return (
    <View style={styles.success}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={44} color={palette.brand} />
      </View>
      <Text style={styles.successTitle}>Your file is ready</Text>
      <Text style={styles.successMeta}>
        {filename}
        {sizeLabel ? ` · ${sizeLabel}` : ''}
      </Text>
      <View style={styles.successActions}>
        <BrandButton title="Share / Save" icon="share-outline" onPress={onShareAgain} />
        <BrandButton title="Start over" icon="refresh" variant="secondary" onPress={onReset} />
      </View>
      <Text style={styles.successNote}>Saved to your Docs · built on this phone, never uploaded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btnShell: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  btnGlow: { ...brandGlow },
  btnGradient: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  btnDisabled: { opacity: 0.45 },
  btnPrimaryText: { color: '#ffffff', fontFamily: type.bold, fontSize: 16 },
  btnSecondaryText: { color: palette.foreground, fontFamily: type.semibold, fontSize: 15 },
  pressed: { opacity: 0.9 },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface3,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    overflow: 'hidden',
  },
  field: { gap: 7 },
  fieldLabel: {
    color: palette.muted,
    fontSize: 12,
    fontFamily: type.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: palette.foreground,
    fontSize: 15,
    fontFamily: type.medium,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 3,
    gap: 3,
  },
  // paddingVertical 13 puts the row at ~44dp, the minimum comfortable target.
  segItem: { flex: 1, paddingVertical: 13, borderRadius: radius.sm, alignItems: 'center' },
  segItemActive: { backgroundColor: palette.brandSoft },
  segText: { color: palette.muted, fontSize: 13, fontFamily: type.semibold },
  segTextActive: { color: palette.brand },
  privacyRow: { alignItems: 'center' },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'hsla(160, 60%, 16%, 0.55)',
    borderColor: 'hsla(160, 60%, 30%, 0.5)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  privacy: { color: palette.brand, fontSize: 11.5, fontFamily: type.semibold },
  busyBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  busyText: { color: palette.foreground, fontSize: 14, fontFamily: type.medium },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderWidth: 1,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: palette.danger, fontSize: 13, fontFamily: type.medium, flex: 1 },
  success: {
    backgroundColor: palette.brandSoft,
    borderColor: 'hsla(160, 70%, 40%, 0.55)',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 22,
    gap: 10,
    alignItems: 'center',
    ...brandGlow,
    shadowOpacity: 0.25,
  },
  successIcon: { paddingBottom: 2 },
  successTitle: { color: palette.foreground, fontSize: 19, fontFamily: type.display },
  successMeta: { color: 'hsl(210, 30%, 85%)', fontSize: 13, fontFamily: type.medium },
  successActions: { alignSelf: 'stretch', gap: 8, paddingTop: 8 },
  successNote: { color: palette.muted, fontSize: 11, fontFamily: type.regular, paddingTop: 2 },
});
