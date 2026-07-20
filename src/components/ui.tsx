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
import { palette } from '@/lib/brand';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' ? styles.btnPrimary : styles.btnSecondary,
        disabled && styles.btnDisabled,
        pressed && styles.pressed,
      ]}
    >
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
      accessibilityLabel={label}
      hitSlop={4}
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
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onChange(o.id)}
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
      <Ionicons name="shield-checkmark" size={13} color={palette.brand} />
      <Text style={styles.privacy}>On-device only · No upload · Free</Text>
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
  return (
    <View style={styles.success}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={40} color={palette.brand} />
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
      <Text style={styles.successNote}>Built on your device. Nothing was uploaded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: palette.brandStrong },
  btnSecondary: { backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.border },
  btnDisabled: { opacity: 0.45 },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  btnSecondaryText: { color: palette.foreground, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  field: { gap: 6 },
  fieldLabel: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.foreground,
    fontSize: 15,
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 3,
    gap: 3,
  },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segItemActive: { backgroundColor: palette.brandSoft },
  segText: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  segTextActive: { color: palette.brand },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  privacy: { color: palette.brand, fontSize: 12, fontWeight: '600' },
  busyBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  busyText: { color: palette.foreground, fontSize: 14 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: palette.danger, fontSize: 13, flex: 1 },
  success: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  successIcon: { paddingBottom: 2 },
  successTitle: { color: palette.foreground, fontSize: 18, fontWeight: '800' },
  successMeta: { color: palette.muted, fontSize: 13 },
  successActions: { alignSelf: 'stretch', gap: 8, paddingTop: 6 },
  successNote: { color: palette.muted, fontSize: 11, paddingTop: 2 },
});
