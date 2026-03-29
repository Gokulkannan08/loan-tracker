# Styling

- **Tailwind CSS v4** — CSS-based config via `@theme {}` in `src/index.css`. No `tailwind.config.js`.
- **Vite plugin**: `@tailwindcss/vite` in `vite.config.ts` (not PostCSS)
- **Dark mode**: class-based via `@custom-variant dark (&:where(.dark, .dark *))`. `dark` class on `<html>`.
- **Colors**: OKLCH format in `src/index.css` `:root` / `.dark` blocks
  - Primary accent: `oklch(0.505 0.213 27.518)` light / `oklch(0.444 0.177 26.899)` dark (orange-red)
- **Fonts**: IBM Plex Sans Variable (`font-sans`, UI text), JetBrains Mono (`font-mono`, all numbers)
- **Icons**: `@tabler/icons-react`
