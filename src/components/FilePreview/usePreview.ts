import { useEffect, useState } from 'react';

export function usePreview<T>(file: File, loader: (file: File) => Promise<T>) {
  const [state, setState] = useState<{ file: File; value?: T; error?: string }>();
  useEffect(() => {
    let cancelled = false;
    loader(file).then(
      (value) => {
        if (!cancelled) {
          setState({ file, value });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({ file, error: error instanceof Error ? error.message : '无法解析此文件。' });
        }
      },
    );
    return () => {
      cancelled = true;
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
