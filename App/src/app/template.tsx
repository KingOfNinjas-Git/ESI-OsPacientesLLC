// FICHEIRO: template.tsx
// Dá uma animação suave quando mudas de página: o conteúdo aparece a "subir" e a ficar visível (fade).
// O layout fica sempre igual entre páginas, mas o `template` é recriado a cada navegação,
// e é isso que faz a animação repetir-se de cada vez (a animação CSS chama-se `page-in`, em styles/animations.css).
// Usámos CSS e não JavaScript de propósito: arranca logo à primeira, sem esperar que o JavaScript carregue,
// e por isso nunca se vê um ecrã vazio. O cabeçalho e a barra de navegação (que estão no layout) ficam parados.

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
