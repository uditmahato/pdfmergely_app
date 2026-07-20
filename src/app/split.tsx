import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, TextField } from '@/components/ui';
import { split, type SplitOutput } from '@/core/engine/split';
import { parseRanges } from '@/lib/ranges';
import { formatBytes, shareResult } from '@/lib/files';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function SplitScreen() {
  const doc = useSingleDoc();
  const [ranges, setRanges] = React.useState('');
  const [parts, setParts] = React.useState<SplitOutput[] | null>(null);

  const groups = doc.pageCount ? parseRanges(ranges, doc.pageCount) : [];

  async function run() {
    // Unlike single-output tools, split produces N files: show a results list
    // with a share button per file instead of auto-opening one share sheet.
    await doc.run(async (bytes) => {
      const out = await split(bytes, groups);
      setParts(out);
      return { bytes: out[0].bytes, filename: out[0].name };
    });
  }

  // The shell's success card handles the single-part case; for multi-part
  // results we show our own list below the options instead.
  if (doc.done && parts && parts.length > 1) {
    return (
      <View style={styles.resultsScreen}>
        <View style={styles.resultsHead}>
          <Ionicons name="checkmark-circle" size={36} color={palette.brand} />
          <Text style={styles.resultsTitle}>
            {parts.length} files ready
          </Text>
          <Text style={styles.resultsSub}>Built on your device. Share or save each file.</Text>
        </View>
        {parts.map((p) => (
          <View key={p.name} style={styles.partRow}>
            <View style={styles.partIcon}>
              <Ionicons name="document-text" size={18} color={palette.danger} />
            </View>
            <View style={styles.partBody}>
              <Text style={styles.partName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.partMeta}>{formatBytes(p.bytes.byteLength)}</Text>
            </View>
            <Pressable
              onPress={() => void shareResult(p.bytes, p.name)}
              style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
            >
              <Ionicons name="share-outline" size={16} color="#ffffff" />
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() => {
            setParts(null);
            doc.reset();
          }}
          style={({ pressed }) => [styles.startOver, pressed && styles.pressed]}
        >
          <Ionicons name="refresh" size={16} color={palette.foreground} />
          <Text style={styles.startOverText}>Start over</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SingleDocShell
      doc={doc}
      // When nothing valid is typed yet, the button names the missing step
      // instead of showing a cryptic "Split into … files".
      runLabel={
        groups.length === 0
          ? 'Enter page ranges'
          : `Split into ${groups.length} file${groups.length === 1 ? '' : 's'}`
      }
      onRun={run}
      runDisabled={groups.length === 0}
      runIcon="cut"
      busyLabel="Splitting on your device…"
    >
      <Field label={`Page ranges (1-${doc.pageCount})`}>
        <TextField
          value={ranges}
          onChangeText={setRanges}
          placeholder="e.g. 1-3, 5, 8-10"
          autoCapitalize="none"
          autoCorrect={false}
          // Android's phone pad: digits plus "-" and "," — everything ranges
          // need, without the full QWERTY keyboard.
          keyboardType="phone-pad"
        />
      </Field>
      <Text style={styles.hint}>
        Each comma-separated range becomes its own PDF. Example: “1-3, 7” makes two files.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  resultsScreen: { flex: 1, backgroundColor: palette.bg, padding: 16, gap: 8 },
  resultsHead: { alignItems: 'center', gap: 4, paddingVertical: 18 },
  resultsTitle: { color: palette.foreground, fontSize: 18, fontWeight: '800' },
  resultsSub: { color: palette.muted, fontSize: 13 },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  partIcon: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  partBody: { flex: 1, gap: 2 },
  partName: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  partMeta: { color: palette.muted, fontSize: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.brandStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  shareText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  startOver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
  },
  startOverText: { color: palette.foreground, fontWeight: '700', fontSize: 14 },
  pressed: { opacity: 0.85 },
});
