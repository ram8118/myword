## Packages
(none needed)

## Notes
- Uses existing Radix/shadcn UI components already in client/src/components/ui
- Audio playback: uses backend POST /api/tts returning base64 audio; frontend decodes to Blob and plays via HTMLAudioElement
- History endpoint uses query param limit (coerce on backend); frontend sends ?limit=5
- Use credentials: "include" for all requests (session cookies)
- Tailwind config already supports font variables via --font-sans/--font-serif/--font-mono; index.css sets --font-sans and --font-display (used via CSS, not Tailwind utility)
