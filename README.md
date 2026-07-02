# HGK

Site institucional e dashboard da HGK, com versões para web, Android e Windows.

## Estrutura

- `src/`: JavaScript, configuração do Supabase e scripts SQL.
- `public/`: imagens e metadados públicos copiados durante o build.
- `dist/`: site pronto para publicação.
- `android/`: projeto nativo do aplicativo Android.
- `desktop/` e `desktop-light/`: aplicativos para Windows.
- `releases/`: APKs e instaladores gerados.
- `tools/`: scripts de build.

## Comandos

- `npm run build`: prepara o site em `dist/`.
- `npm run build:web`: prepara o dashboard móvel em `www/`.
- `npm run android:release`: gera o APK em `releases/android/`.
- `npm run desktop:build`: gera o instalador leve em `releases/windows/`.
- `npm run desktop:build:electron`: gera o instalador Electron em `releases/windows/`.
