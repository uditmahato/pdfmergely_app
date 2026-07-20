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
import { palette } from '@/lib/brand';

export function BrandButton({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
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
      <Text style={variant === 'primary' ? styles.btnPrimaryText : styles.btnSecondaryText}>
        {title}
      </Text>
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
    <TextInput
      placeholderTextColor={palette.muted}
      {...props}
      style={[styles.input, props.style]}
    />
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
  return <Text style={styles.privacy}>Files never leave your device · No upload · Free</Text>;
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
  return <Text style={styles.error}>{text}</Text>;
}

export function DoneNote({ text }: { text: string }) {
  return <Text style={styles.done}>{text}</Text>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnPrimary: { backgroundColor: palette.brandStrong },
  btnSecondary: { backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.border },
  btnDisabled: { opacity: 0.45 },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  btnSecondaryText: { color: palette.foreground, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
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
  privacy: { color: palette.brand, fontSize: 12, textAlign: 'center' },
  busyBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  busyText: { color: palette.foreground, fontSize: 14 },
  error: { color: palette.danger, fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  done: {
    color: palette.brand,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
    lineHeight: 19,
  },
});
