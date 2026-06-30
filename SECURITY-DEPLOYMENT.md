# Implantação segura do HGK

## Banco de dados

1. Faça um backup do projeto Supabase.
2. No SQL Editor, execute `supabase-schema.sql` caso o banco ainda não exista.
3. Execute `supabase-security-hardening.sql` inteiro. Ele roda em transação:
   se uma etapa falhar, nenhuma alteração é confirmada.
4. Publique `index.html`, `script.js`, `dashboard.html`, `dashboard.js`,
   `supabase-config.js` e `_headers` juntos.

A migração cifra os dados pessoais existentes com AES-256. A chave aleatória
fica no Supabase Vault, separada das tabelas e dos backups. O site passa a
gravar somente por RPCs validadas; o dashboard recebe texto descriptografado
somente depois da autorização administrativa.

Não copie o conteúdo de `vault.decrypted_secrets`, não coloque uma
`service_role` no navegador ou APK e não conceda acesso a `private`.

## Configurações manuais no Supabase

- Desative cadastro público em Authentication > Providers > Email.
- Exija senhas fortes e confirmação de e-mail para contas administrativas.
- Ative CAPTCHA e revise os limites em Authentication > Bot and Abuse
  Protection e Rate Limits.
- Crie novos funcionários primeiro em Authentication > Users. Depois, um
  usuário com papel `proprietario` pode autorizá-los no dashboard.
- O campo `mfa_required` permite exigir sessão `aal2`, mas só deve ser marcado
  como `true` depois que o usuário tiver um fator MFA verificado e o fluxo de
  desafio estiver disponível.
- Restrinja o acesso ao projeto Supabase da equipe e ative MFA também nas
  contas do painel Supabase.

## APK

`HGK-Dashboard.apk` é o APK de produção assinado da HGK. Gere uma nova cópia
com `npm run android:release`. No celular, permita a instalação desse arquivo
quando o Android solicitar.

A chave `android/hgk-release.jks` e o arquivo `android/keystore.properties`
devem ser guardados juntos em um gerenciador de segredos e em backup seguro.
Sem eles não é possível publicar atualizações sobre o aplicativo instalado.
Nunca versione `.jks`, `keystore.properties` ou senhas de assinatura.

O aplicativo desativa backup, captura de tela, tráfego HTTP, conteúdo misto e
depuração do WebView. A sessão administrativa permanece apenas em memória e
expira após 15 minutos de inatividade.

## Operação

- Revise mensalmente os administradores e eventos de login.
- Aplique atualizações do Capacitor, Android e Supabase após teste.
- Defina retenção e exclusão de contatos conforme a LGPD.
- Segurança absoluta não existe: mantenha backups testados, monitoração,
  rotação de acessos e um plano de resposta a incidentes.
