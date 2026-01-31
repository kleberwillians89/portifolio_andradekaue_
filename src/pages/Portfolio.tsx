import { useEffect, useMemo, useState, useCallback } from "react";
import "./Portfolio.css";

// IMPORTS DOS ÍCONES (Certifique-se que os arquivos existem nestas pastas)
import iconInsta from "../assets/icons/instagram.png";
import iconLinkedin from "../assets/icons/linkedin.png";
import iconWhats from "../assets/icons/whats.png";

// Tipagem dos itens
type PortfolioItem =
  | {
      type: "image";
      src: string;
      thumb?: string;
      name?: string;
      face?: boolean;
      position?: string;
    }
  | {
      type: "video";
      src: string;
      name?: string;
      face?: boolean;
      position?: string;
    };

// Função de misturar (shuffle)
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // CONFIGURAÇÃO DO GRID (RITMO VISUAL)
  // Baseado na sua imagem: 4 colunas.
  // r = altura (row-span). Valores ajustados para criar o "desencontro" das peças.
  const tiles = useMemo(
    () => [
      { r: 6 }, // 1. Curto
      { r: 9 }, // 2. Longo 
      { r: 6 }, // 3. Curto
      { r: 6 }, // 4. Curto 
      
      { r: 9 }, // 5. Longo 
      { r: 6 }, // 6. Curto 
      { r: 9 }, // 7. Longo 
      { r: 9 }, // 8. Longo 
    ],
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/portfolio/list.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as PortfolioItem[];

        // Mistura a ordem para ficar dinâmico
        const shuffled = shuffle(data);

        if (!alive) return;
        setItems(shuffled);
      } catch (e: any) {
        if (!alive) return;
        console.error(e);
        setError("Não foi possível carregar o portfólio.");
      }
    })();
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => items, [items]);
  const active = openIndex === null ? null : visible[openIndex] ?? null;

  const closeModal = useCallback(() => setOpenIndex(null), []);

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openIndex === null) return;
    setOpenIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));
  }, [openIndex, visible.length]);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openIndex === null) return;
    setOpenIndex((i) => (i === null ? null : (i + 1) % visible.length));
  }, [openIndex, visible.length]);

  // Teclado (Setas e ESC)
  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? null : (i + 1) % visible.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, closeModal, visible.length]);

  // Trava scroll quando modal abre
  useEffect(() => {
    if (openIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [openIndex]);

  return (
    <div className="page">
      <header className="header">
        {/* LADO ESQUERDO: NOME + CARGO */}
        <div className="headerLeft">
          <h1 className="name">KAUÊ ANDRADE</h1>
          <span className="role">CREATIVE ART DIRECTOR</span>
        </div>

        {/* LADO DIREITO: EMAIL + ÍCONES */}
        <div className="headerRight">
          <a className="email" href="mailto:andradekaue@outlook.com">andradekaue@outlook.com</a>
          
          <nav className="social">
            {/* INSTAGRAM */}
            <a
              className="socialBtn"
              href="https://www.instagram.com/andradekaue"
              target="_blank"
              rel="noreferrer"
            >
              <img className="socialIcon" src={iconInsta} alt="Instagram" />
            </a>

            {/* LINKEDIN */}
            <a
              className="socialBtn"
              href="https://www.linkedin.com/in/andradekaue/"
              target="_blank"
              rel="noreferrer"
            >
              <img className="socialIcon" src={iconLinkedin} alt="LinkedIn" />
            </a>

            {/* WHATSAPP */}
            <a
              className="socialBtn"
              href="https://wa.me/5513997333625" // <-- COLOQUE SEU NÚMERO AQUI
              target="_blank"
              rel="noreferrer"
            >
              <img className="socialIcon" src={iconWhats} alt="WhatsApp" />
            </a>
          </nav>
        </div>
      </header>

      <main className="content">
        {error ? (
          <div className="errorBox">{error}</div>
        ) : (
          <section className="grid">
            {visible.map((it, i) => {
              // Pega o tile correspondente ao índice (loopando se acabar)
              const t = tiles[i % tiles.length];

              let objPos = "center";
              if (it.face) objPos = "center 20%";
              if (it.position) objPos = it.position;

              return (
                <button
                  key={`${it.type}-${it.src}-${i}`}
                  className="card"
                  style={{ "--r": t.r } as React.CSSProperties}
                  onClick={() => setOpenIndex(i)}
                >
                  {it.type === "image" ? (
                    <img src={it.src} alt="" loading="lazy" style={{ objectPosition: objPos }} />
                  ) : (
                    <video className="video" src={it.src} muted loop playsInline autoPlay style={{ objectPosition: objPos }} />
                  )}
                </button>
              );
            })}
          </section>
        )}
      </main>

      {/* MODAL */}
      {openIndex !== null && active && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modalClose" onClick={closeModal}>×</button>
            <button className="modalNav modalPrev" onClick={prev}>‹</button>
            <button className="modalNav modalNext" onClick={next}>›</button>

            <div className="modalMedia">
              {active.type === "image" ? (
                <img className="modalImg" src={active.src} alt="" />
              ) : (
                <video className="modalVid" src={active.src} controls autoPlay playsInline />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}