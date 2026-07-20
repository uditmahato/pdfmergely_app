import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, TextField } from '@/components/ui';
import { unlock } from '@/core/engine/protect';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function UnlockScreen() {
  const doc = useSingleDoc();
  const [password, setPassword] = React.useState('');

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await unlock(bytes, password),
      filename: 'unlocked.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Remove password"
      onRun={run}
      runDisabled={password.length === 0}
      busyLabel="Decrypting on your device…"
    >
      <Field label="Current password">
        <TextField value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </Field>
      <Text style={styles.hint}>
        For PDFs you own and know the password to. Decryption happens locally; the password never
        leaves this device.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
