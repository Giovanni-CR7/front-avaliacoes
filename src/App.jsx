import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

// Em dev: o Vite redireciona /api para o back local (vite.config.js).
// Em producao: a Vercel redireciona /api para a EC2 (vercel.json). Assim nao ha "mixed content" (HTTPS -> HTTP).
const API_URL = "http://3.239.159.144/avaliacoes";

const PERM_ESCRITA = "write:avaliacoes";

// Le as permissoes que o Auth0 colocou dentro do access token (so para decidir o que mostrar;
// quem realmente protege as rotas e o back-end).
function lerPermissoes(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.permissions ?? [];
  } catch {
    return [];
  }
}

function textoDoErro(error, acao) {
  const status = error?.response?.status;
  if (status === 401) return "Sessão inválida ou token rejeitado pela API. Saia e entre novamente.";
  if (status === 403) return `Sem permissão para ${acao}. Essa ação exige o perfil ADMIN.`;
  if (status === 400) return "Dados inválidos. Confira os e-mails e a nota (0 a 10).";
  if (!error?.response) return "Não foi possível falar com a API (rede, CORS ou servidor fora do ar).";
  return `Erro ${status} ao ${acao}.`;
}

const estilos = {
  pagina: { padding: 30, fontFamily: "system-ui, sans-serif", maxWidth: 820, margin: "0 auto", color: "#1b2430" },
  topo: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  cartao: { padding: 16, border: "1px solid #d9dee5", borderRadius: 8, marginBottom: 28 },
  campo: { padding: 8, border: "1px solid #c5ccd6", borderRadius: 4, font: "inherit" },
  botao: { padding: "10px 16px", cursor: "pointer", background: "#0b5cad", color: "#fff", border: "none", borderRadius: 6, font: "inherit" },
  botaoSec: { padding: "6px 12px", cursor: "pointer", background: "transparent", border: "1px solid #c5ccd6", borderRadius: 6, font: "inherit" },
  item: { padding: 12, border: "1px solid #e6e9ee", borderRadius: 6, background: "#fafbfc" },
};

export default function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [permissoes, setPermissoes] = useState(null); // null = ainda nao carregou
  const [erroLista, setErroLista] = useState("");
  const [mensagem, setMensagem] = useState(null); // { tipo: "ok" | "erro", texto }
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ emailAvaliado: "", comentarios: "", nota: 10 });

  const carregarAvaliacoes = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      setPermissoes(lerPermissoes(token));
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setAvaliacoes(response.data);
      setErroLista("");
    } catch (error) {
      console.error("Erro ao listar avaliações:", error);
      setErroLista(textoDoErro(error, "listar as avaliações"));
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) carregarAvaliacoes();
  }, [isAuthenticated, carregarAvaliacoes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    setEnviando(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.post(
        API_URL,
        {
          emailAvaliador: user.email, // o avaliador e quem esta logado
          emailAvaliado: form.emailAvaliado,
          comentariosAvaliacao: form.comentarios,
          nota: Number(form.nota),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensagem({ tipo: "ok", texto: "Avaliação cadastrada com sucesso!" });
      setForm({ emailAvaliado: "", comentarios: "", nota: 10 });
      carregarAvaliacoes();
    } catch (error) {
      console.error(error);
      setMensagem({ tipo: "erro", texto: textoDoErro(error, "cadastrar a avaliação") });
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading) return <div style={{ padding: 20 }}>Carregando autenticação...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ ...estilos.pagina, textAlign: "center", marginTop: "15vh" }}>
        <h1>Sistema de Avaliações</h1>
        <p>Entre com sua conta para ver e cadastrar avaliações.</p>
        <button onClick={() => loginWithRedirect()} style={estilos.botao}>Entrar</button>
      </div>
    );
  }

  const podeCadastrar = permissoes?.includes(PERM_ESCRITA);
  const semPermissoesNoToken = permissoes !== null && permissoes.length === 0;

  return (
    <div style={estilos.pagina}>
      <header style={estilos.topo}>
        <h2>Sistema de Avaliações</h2>
        <div>
          <span>{user?.email}</span>{" "}
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ ...estilos.botaoSec, marginLeft: 10 }}
          >
            Sair
          </button>
        </div>
      </header>

      <hr style={{ margin: "20px 0" }} />

      {semPermissoesNoToken && (
        <p style={{ color: "#a86a00" }}>
          O token não trouxe nenhuma permissão. Confira no Auth0: RBAC ativado na API, "Add Permissions in the Access Token" ligado
          e papel atribuído ao usuário.
        </p>
      )}

      {podeCadastrar ? (
        <section style={estilos.cartao}>
          <h3 style={{ marginTop: 0 }}>Cadastrar avaliação</h3>
          {mensagem && <p style={{ color: mensagem.tipo === "ok" ? "#1d7a46" : "#b3261e" }}>{mensagem.texto}</p>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="email" placeholder="E-mail do avaliado" required style={estilos.campo}
              value={form.emailAvaliado} onChange={(e) => setForm({ ...form, emailAvaliado: e.target.value })} />
            <textarea placeholder="Comentários sobre o desempenho" rows={3} style={estilos.campo}
              value={form.comentarios} onChange={(e) => setForm({ ...form, comentarios: e.target.value })} />
            <label>
              Nota (0 a 10):{" "}
              <input type="number" min="0" max="10" required style={{ ...estilos.campo, width: 70 }}
                value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            </label>
            <small style={{ color: "#5d6b7c" }}>Avaliador: {user?.email}</small>
            <button type="submit" disabled={enviando} style={estilos.botao}>
              {enviando ? "Salvando..." : "Salvar avaliação"}
            </button>
          </form>
        </section>
      ) : (
        permissoes !== null && !semPermissoesNoToken && (
          <p style={{ color: "#5d6b7c" }}>Seu perfil permite apenas visualizar as avaliações.</p>
        )
      )}

      <section>
        <h3>Avaliações cadastradas</h3>
        {erroLista && <p style={{ color: "#b3261e" }}>{erroLista}</p>}
        {!erroLista && avaliacoes.length === 0 ? (
          <p>Nenhuma avaliação encontrada.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avaliacoes.map((item) => (
              <div key={item.id} style={estilos.item}>
                <p style={{ margin: "0 0 6px" }}>
                  <strong>Avaliador:</strong> {item.emailAvaliador} | <strong>Avaliado:</strong> {item.emailAvaliado}
                </p>
                <p style={{ margin: "0 0 6px" }}><strong>Nota:</strong> {item.nota}/10</p>
                <p style={{ margin: "0 0 6px" }}>
                  <strong>Comentário:</strong> {item.comentariosAvaliacao ?? item.comentarios ?? "Sem comentários."}
                </p>
                <small style={{ color: "#5d6b7c" }}>
                  Data: {item.dataAvaliacao ? new Date(item.dataAvaliacao).toLocaleString("pt-BR") : "-"}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}