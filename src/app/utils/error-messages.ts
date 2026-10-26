/**
 * Utilitário central de tradução e sanitização de mensagens de erro.
 * Garante que nenhum erro técnico em inglês ou menções a "banco de dados" / infraestrutura
 * sejam expostos ao usuário final.
 */

export function traduzirErro(error: any, fallbackPadrao = 'Ocorreu um imprevisto ao processar sua solicitação. Tente novamente em instantes.'): string {
  if (!error) {
    return fallbackPadrao;
  }

  // Extrai a mensagem de texto de qualquer formato de erro comum
  const rawMsg = (
    typeof error === 'string'
      ? error
      : error?.message || error?.error_description || error?.msg || error?.error || ''
  ).toLowerCase();

  const rawCode = (error?.code || '').toLowerCase();

  // 1. Falhas de conexão / rede / servidor indisponível
  if (
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('network') ||
    rawMsg.includes('fetch') ||
    rawMsg.includes('load failed') ||
    rawMsg.includes('connection') ||
    rawMsg.includes('econnrefused') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('offline')
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente em instantes.';
  }

  // 2. Sessão ausente / expirada na redefinição de senha
  if (
    rawMsg.includes('auth session missing') ||
    rawMsg.includes('session missing') ||
    rawMsg.includes('session_missing') ||
    rawMsg.includes('no current session') ||
    rawMsg.includes('user not authenticated') ||
    rawCode === 'session_missing'
  ) {
    return 'Sua sessão de recuperação de senha é inválida ou expirou. Por favor, solicite um novo link de redefinição.';
  }

  // 3. Credenciais inválidas (login)
  if (
    rawMsg.includes('invalid login credentials') ||
    rawMsg.includes('invalid_credentials') ||
    rawMsg.includes('bad credentials')
  ) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente.';
  }

  // 4. E-mail não confirmado
  if (
    rawMsg.includes('email not confirmed') ||
    rawMsg.includes('email_not_confirmed')
  ) {
    return 'Seu endereço de e-mail ainda não foi confirmado. Verifique sua caixa de entrada para ativar a conta.';
  }

  // 5. Usuário / e-mail já existente (cadastro)
  if (
    rawMsg.includes('user already registered') ||
    rawMsg.includes('user_already_exists') ||
    rawMsg.includes('already exists') ||
    rawMsg.includes('already registered') ||
    rawCode === 'user_already_exists'
  ) {
    return 'Este endereço de e-mail já está cadastrado. Faça login para acessar sua conta.';
  }

  // 6. Nova senha igual à antiga
  if (
    rawMsg.includes('same_password') ||
    rawMsg.includes('new password should be different') ||
    rawMsg.includes('same password')
  ) {
    return 'A nova senha precisa ser diferente da senha anterior.';
  }

  // 7. Token ou código de verificação expirado
  if (
    rawMsg.includes('token has expired') ||
    rawMsg.includes('token is expired') ||
    rawMsg.includes('otp_expired') ||
    rawMsg.includes('token expired')
  ) {
    return 'O link de acesso expirou. Por favor, solicite um novo link.';
  }

  // 8. Token inválido ou corrompido
  if (
    rawMsg.includes('invalid token') ||
    rawMsg.includes('token is invalid') ||
    rawMsg.includes('token_invalid') ||
    rawMsg.includes('bad_code_verifier') ||
    rawMsg.includes('invalid code')
  ) {
    return 'O link de recuperação é inválido ou já foi utilizado. Solicite um novo link.';
  }

  // 9. Limite de requisições / tentativas
  if (
    rawMsg.includes('rate limit') ||
    rawMsg.includes('over_email_send_rate_limit') ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('rate_limit')
  ) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }

  // 10. Requisitos de senha fraca
  if (
    rawMsg.includes('password should be at least') ||
    rawMsg.includes('weak_password') ||
    rawMsg.includes('password is too short')
  ) {
    return 'A senha deve conter no mínimo 8 caracteres e atender a todos os critérios de segurança.';
  }

  // 11. Usuário não encontrado
  if (rawMsg.includes('user not found')) {
    return 'Usuário não encontrado. Verifique o e-mail informado.';
  }

  // 12. Token de sessão JWT expirado
  if (rawMsg.includes('jwt expired') || rawMsg.includes('token expired')) {
    return 'Sua sessão expirou por segurança. Por favor, faça login novamente.';
  }

  // 13. Erros de banco de dados / permissão interna — sanitizados para o usuário
  if (
    rawMsg.includes('database') ||
    rawMsg.includes('postgres') ||
    rawMsg.includes('relation') ||
    rawMsg.includes('violates') ||
    rawMsg.includes('foreign key') ||
    rawMsg.includes('row-level security') ||
    rawMsg.includes('permission denied')
  ) {
    return 'O serviço está passando por uma oscilação momentânea. Por favor, tente novamente em alguns instantes.';
  }

  // Fallback seguro em português
  return fallbackPadrao;
}
