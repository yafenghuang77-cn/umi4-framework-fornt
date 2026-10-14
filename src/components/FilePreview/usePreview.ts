import { useEffect, useState } from 'react';

import { getFileKind } from '@/utils/file';
import { startMeasure } from '@/utils/monitoring';

export function usePreview<T>(file: File, loader: (file: File) => Promise<T>) {
  const [state, setState] = useState<{ file: File; value?: T; error?: string }>();
  useEffect(() => {
    let cancelled = false;
    const finish = startMeasure(`PREVIEW_PARSE_${getFileKind(file).toUpperCase()}`);
    loader(file).then(
      (value) => {
        finish(cancelled ? 'cancelled' : 'success');
        if (!cancelled) {
          setState({ file, value });
        }
      },
      (error: unknown) => {
        finish(cancelled ? 'cancelled' : 'error');
        if (!cancelled) {
          setState({ file, error: error instanceof Error ? error.message : '无法解析此文件。' });
        }
      },
    );
    return () => {
      cancelled = true;
      finish('cancelled');
    };
  }, [file, loader]);
  return state?.file === file ? state : undefined;
}

export function useObjectUrl(file: File) {
  const [state, setState] = useState<{ file: File; url: string }>();
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setState({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return state?.file === file ? state.url : undefined;
}
