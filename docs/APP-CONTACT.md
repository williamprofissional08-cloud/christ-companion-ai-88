# E-mail oficial do Caminho Divino

Endereço institucional centralizado no código:

- **E-mail:** caminhando.com_cristo@outlook.com
- **Uso:** contato geral, suporte, administração, moderação e recebimento de materiais enviados pelos membros.

## Regras de segurança

- Este endereço é um canal de contato, não uma identidade administrativa.
- Não conceder privilégios de administrador no Supabase apenas porque uma conta usa este endereço.
- Não expor chaves, tokens ou credenciais no frontend ou no repositório.
- Mensagens de moderação devem continuar registradas no banco mesmo se o envio de e-mail falhar.

## Ativação de e-mails automáticos

O projeto Supabase conectado ainda não possui Edge Functions implantadas. Para ativar notificações, é necessário escolher e configurar um provedor transacional (por exemplo, Resend), verificar o domínio/remetente exigido pelo provedor e armazenar a chave da API como secret no Supabase (nunca no código). Depois disso, implementar e testar uma Edge Function autenticada para enviar notificações de suporte, moderação e administração.

Até essa configuração, o endereço está centralizado como contato institucional, mas o sistema não envia e-mails automaticamente.
