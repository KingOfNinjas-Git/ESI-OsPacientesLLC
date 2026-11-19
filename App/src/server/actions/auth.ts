// FICHEIRO: actions/auth.ts
// Aqui estão as ações de autenticação: iniciar sessão, criar conta e terminar sessão.
//
// O "use server" quer dizer que estas funções correm SEMPRE no servidor, mesmo quando
// são chamadas por um formulário no browser (`<form action={loginAction}>`).
// Elas devolvem um `FormState`, que é um "recado" com os erros para o formulário mostrar.

"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signIn, signOut } from "@/server/auth";
import { query } from "@/server/db";

// O que devolvemos aos formulários: um erro geral, erros de cada campo,
// e os valores que a pessoa escreveu (para não ter de os escrever todos outra vez).
export type FormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | undefined;

// Mensagem que mostramos quando alguém tenta demasiadas vezes.
const TOO_MANY = "Demasiadas tentativas. Espera alguns minutos e tenta de novo.";

// Termina a sessão e leva a pessoa de volta à página inicial.
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

// Inicia sessão. Se correr bem, o Auth.js leva a pessoa para `callbackUrl`
// (a página que ela queria abrir antes de ser mandada para o login).
// Só aceitamos endereços internos (que começam por "/") para ninguém ser enviado para sites falsos.
export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // Para onde ir depois do login. Se não vier nada, vai para a página inicial.
  const callbackUrl = String(formData.get("callbackUrl") || "/");
  // Travão contra quem tenta adivinhar palavras-passe: 8 tentativas por IP e email a cada 10 minutos.
  const ip = clientIp(await headers());
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rateLimit(`login:${ip}:${email}`, 8, 10 * 60_000).ok) return { error: TOO_MANY, values: { email } };
  try {
    // Tenta iniciar sessão com o email e a palavra-passe que a pessoa escreveu.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/",
    });
  } catch (err) {
    // Se for um erro de login (dados errados), avisamos a pessoa sem dizer qual dos dois estava errado.
    if (err instanceof AuthError) return { error: "Email ou palavra-passe incorretos.", values: { email: String(formData.get("email") ?? "") } };
    // Qualquer outra coisa volta a ser lançada. Nota: o redirecionamento depois de um login com sucesso
    // também "salta" por aqui como se fosse um erro, e é assim mesmo que o Next.js funciona.
    throw err;
  }
}

// As regras do formulário de registo. Cada mensagem aparece junto ao campo que falhou.
const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email inválido."),
    firstName: z.string().trim().min(1, "Indica o teu nome.").max(100),
    lastName: z.string().trim().min(1, "Indica o teu sobrenome.").max(100),
    password: z
      .string()
      .min(8, "A palavra-passe precisa de pelo menos 8 caracteres.")
      .regex(/[a-zA-Z]/, "A palavra-passe precisa de pelo menos uma letra.")
      .regex(/\d/, "A palavra-passe precisa de pelo menos um número."),
    confirm: z.string(),
  })
  // Regra extra: a palavra-passe e a confirmação têm de ser iguais.
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "As palavras-passe não coincidem." });

// Cria uma conta de cliente e inicia logo a sessão.
export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // No máximo 5 contas novas por IP a cada hora (evita alguém criar contas em massa).
  if (!rateLimit(`register:${clientIp(await headers())}`, 5, 60 * 60_000).ok) return { error: TOO_MANY };
  // Transforma o formulário num objeto simples.
  const raw = Object.fromEntries(formData) as Record<string, string>;
  // Guardamos o que a pessoa escreveu (sem palavras-passe!) para devolver ao formulário e ele não ficar em branco.
  const values = { email: raw.email ?? "", firstName: raw.firstName ?? "", lastName: raw.lastName ?? "" };
  // Verifica tudo com as regras de cima.
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    // Recolhe a primeira mensagem de erro de cada campo (o `??=` só escreve se ainda não houver uma).
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values };
  }
  // Os dados já estão limpos e validados.
  const { email, firstName, lastName, password } = parsed.data;

  // Confirma que não existe já uma conta com este email.
  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length) return { fieldErrors: { email: "Já existe uma conta com este email." }, values };

  // Baralha a palavra-passe (hash) antes de a guardar. Nunca se guarda a palavra-passe em texto normal!
  const hash = await bcrypt.hash(password, 10);
  // Contas novas são sempre "cliente". Só o administrador pode mudar o papel mais tarde.
  await query("INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, 'cliente')", [
    email,
    hash,
    firstName,
    lastName,
  ]);

  // Conta criada: inicia logo a sessão para a pessoa não ter de fazer login a seguir.
  await signIn("credentials", { email, password, redirectTo: "/" });
}
