import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import axios from "axios";

// Substitua o IP_DA_EC2 pelo IP público correto da sua máquina AWS
const API_URL = "http://IP_DA_EC2:8080/avaliacoes";

export default function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [formData, setFormData] = useState({
    emailAvaliador: "",
    emailAvaliado: "",
    comentarios: "",
    nota: 10
  });
  const [mensagem, setMensagem] = useState("");

  const carregarAvaliacoes = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvaliacoes(response.data);
    } catch (error) {
      console.error("Erro ao listar avaliações:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      carregarAvaliacoes();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");
    try {
      const token = await getAccessTokenSilently();
      await axios.post(API_URL, {
        emailAvaliador: formData.emailAvaliador,
        emailAvaliado: formData.emailAvaliado,
        comentarios: formData.comentarios,
        nota: Number(formData.nota)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensagem("Avaliação registada com sucesso!");
      setFormData({ emailAvaliador: "", emailAvaliado: "", comentarios: "", nota: 10 });
      carregarAvaliacoes();
    } catch (error) {
      setMensagem("Erro ao registar: certifique-se de que possui permissão de ADMIN.");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 20 }}>A carregar autenticação...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
        <h1>Sistema de Avaliações</h1>
        <p>Inicie sessão com o Auth0 para aceder à plataforma.</p>
        <button 
          onClick={() => loginWithRedirect()}
          style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer", background: "#0070f3", color: "white", border: "none", borderRadius: "5px" }}
        >
          Iniciar Sessão
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Sistema de Avaliações</h2>
        <div>
          <span>Utilizador: <strong>{user?.name || user?.email}</strong> </span>
          <button 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ marginLeft: 10, padding: "5px 10px", cursor: "pointer" }}
          >
            Terminar Sessão
          </button>
        </div>
      </header>

      <hr style={{ margin: "20px 0" }} />

      <section style={{ marginBottom: 30, padding: 15, border: "1px solid #ccc", borderRadius: 8 }}>
        <h3>Registar Avaliação (ADMIN)</h3>
        {mensagem && <p style={{ color: mensagem.includes("sucesso") ? "green" : "red" }}>{mensagem}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="email" placeholder="Email do Avaliador" value={formData.emailAvaliador} onChange={(e) => setFormData({ ...formData, emailAvaliador: e.target.value })} required style={{ padding: 8 }} />
          <input type="email" placeholder="Email do Avaliado" value={formData.emailAvaliado} onChange={(e) => setFormData({ ...formData, emailAvaliado: e.target.value })} required style={{ padding: 8 }} />
          <textarea placeholder="Comentários sobre o desempenho" value={formData.comentarios} onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })} rows={3} style={{ padding: 8 }} />
          <label>Nota (0 a 10): <input type="number" min="0" max="10" value={formData.nota} onChange={(e) => setFormData({ ...formData, nota: e.target.value })} required style={{ marginLeft: 10, padding: 4 }} /></label>
          <button type="submit" style={{ padding: "10px 15px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4 }}>Submeter Avaliação</button>
        </form>
      </section>

      <section>
        <h3>Avaliações Registadas</h3>
        {avaliacoes.length === 0 ? (
          <p>Nenhuma avaliação encontrada.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avaliacoes.map((item) => (
              <div key={item.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 6, background: "#fafafa" }}>
                <p><strong>Avaliador:</strong> {item.emailAvaliador} | <strong>Avaliado:</strong> {item.emailAvaliado}</p>
                <p><strong>Nota:</strong> {item.nota}/10</p>
                <p><strong>Comentário:</strong> {item.comentarios || "Sem comentários."}</p>
                <small style={{ color: "#666" }}>Data: {item.dataAvaliacao ? new Date(item.dataAvaliacao).toLocaleString() : "-"}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}