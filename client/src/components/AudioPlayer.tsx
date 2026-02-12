import { useEffect, useMemo, useRef } from "react";

function base64ToBlob(base64: string, contentType: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const bytes = new Uint8Array(byteNumbers);
  return new Blob([bytes], { type: contentType || "audio/mpeg" });
}

export default function AudioPlayer({
  audioBase64,
  contentType,
  autoPlay = true,
  onEnded,
}: {
  audioBase64: string;
  contentType: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const url = useMemo(() => {
    const blob = base64ToBlob(audioBase64, contentType);
    return URL.createObjectURL(blob);
  }, [audioBase64, contentType]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const handleEnded = () => onEnded?.();
    a.addEventListener("ended", handleEnded);

    if (autoPlay) {
      // ignore autoplay errors; user interaction may be required
      a.play().catch(() => {});
    }

    return () => {
      a.removeEventListener("ended", handleEnded);
    };
  }, [autoPlay, onEnded, url]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <audio
      ref={audioRef}
      src={url}
      controls
      className="w-full"
      data-testid="tts-audio-player"
    />
  );
}
