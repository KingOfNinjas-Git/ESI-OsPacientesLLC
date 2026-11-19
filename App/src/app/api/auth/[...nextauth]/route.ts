// FICHEIRO: api/auth/[...nextauth]/route.ts
// As "portas" internas do Auth.js (/api/auth/session, /api/auth/callback/...).
// O Auth.js trata de tudo sozinho, por isso não é preciso mexer aqui.

import { handlers } from "@/server/auth";

// Exportamos o GET e o POST que o Auth.js já preparou (em server/auth.ts).
export const { GET, POST } = handlers;
