require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rota de login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// Rota de cadastro
app.post("/register", async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Se o erro indicar duplicação, você pode tratar aqui
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user?.id; // Verifica se o ID existe

    if (!userId) {
      return res.status(400).json({ error: "Erro ao obter ID do usuário." });
    }

    // Verificar se o usuário já existe na tabela 'users'
    const { data: existingUsers, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userCheckError) {
      throw userCheckError;
    }

    // Se já existe o usuário, retorna erro
    if (existingUsers) {
      return res
        .status(400)
        .json({ error: "Usuário já existe na tabela 'users'." });
    }

    // Inserir usuário na tabela 'users'
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: userId, // ID do usuário autenticado
        name,
        phone,
        email,
        created_at: new Date(),
      },
    ]);

    if (dbError) {
      throw dbError;
    }

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000; // Define a porta do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API rodando...");
});

// Adicione estas rotas após suas rotas de /login e /register

// Endpoint para obter os dados do perfil do usuário
// Exemplo: GET https://backen-neocliq.onrender.com/profile?email=exemplo@dominio.com
app.get("/profile", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Busca o usuário na tabela 'users'
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single(); // Espera exatamente um resultado

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// Endpoint para atualizar os dados do perfil do usuário
// Exemplo: PUT https://backen-neocliq.onrender.com/profile
// Corpo (JSON):
// {
//    "email": "exemplo@dominio.com",
//    "nome": "Nome atualizado",
//    "telefone": "11999999999",
//    "dataNascimento": "1990-01-01",
//    "foto": "data:image/png;base64,iVBORw0KGgoAAAANS..."
// }
app.put("/profile", async (req, res) => {
  const { email, nome, telefone, dataNascimento, foto } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Atualiza as informações do usuário na tabela 'users'
  const { data, error } = await supabase
    .from("users")
    .update({ nome, telefone, dataNascimento, foto })
    .eq("email", email);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Profile updated successfully", data });
});
