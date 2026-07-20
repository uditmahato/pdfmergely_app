import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, TextField } from '@/components/ui';
import { protect } from '@/core/engine/protect';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function ProtectScreen() {
  const doc = useSingleDoc();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  const mismatch = confirm.length > 0 && password !== confirm;
  const ready = password.length >= 4 && password === confirm;

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await protect(bytes, { userPassword: password }),
      filename: 'protected.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Protect with password"
      onRun={run}
      runDisabled={!ready}
      busyLabel="Encrypting on your device…"
    >
      <Field label="Password (min 4 characters)">
        <TextField value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </Field>
      <Field label="Confirm password">
        <TextField value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
      </Field>
      {mismatch && <Text style={styles.mismatch}>Passwords do not match.</Text>}
      <Text style={styles.hint}>
        AES encryption runs on this device. The password is never stored or sent anywhere, and there
        is no way to recover it if lost.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  mismatch: { color: palette.danger, fontSize: 12 },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
