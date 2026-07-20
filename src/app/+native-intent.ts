// expo-router native-intent hook: runs BEFORE routing for every URL the app
// is opened with, cold or warm. "Open with PDFMergely" (ACTION_VIEW) delivers
// the PDF's content:// URI as that URL; without this hook the router tries to
// treat it as a deep link and lands on Unmatched Route.
import { stashIncoming } from '@/lib/incoming';
import { setIncomingScreenFiles } from './incoming';

// The URL usually arrives raw (content:// or file://), but some router paths
// hand it over already rewritten into the app scheme with one extra layer of
// percent-encoding: pdfmergely://<authority>/<segment%253A...>. Undo that.
function toFileUri(path: string): string | null {
  if (path.startsWith('content://') || path.startsWith('file://')) return path;
  const rewritten = path.match(/^pdfmergely:\/\/([^?#]+)/);
  if (rewritten) {
    const [authority, ...segments] = rewritten[1].split('/');
    // A real deep link has a route-like host (or none); a rewritten content
    // URI carries a provider authority, which always contains dots.
    if (authority.includes('.') && segments.length > 0) {
      const decoded = segments.map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      });
      return `content://${authority}/${decoded.join('/')}`;
    }
  }
  return null;
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const uri = toFileUri(path);
    if (!uri) return path;
    const rawName = decodeURIComponent(uri.split('/').pop() ?? 'document.pdf');
    const name = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
    const file = { name, size: 0, uri };
    stashIncoming([file]);
    setIncomingScreenFiles([file]);
    return '/incoming';
  } catch {
    // Never break launch over an unparseable URL; land on Home instead.
    return '/';
  }
}
