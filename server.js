require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: "*" }));
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

//
//
//
//
//
//
//
//cadastro empresa
// Endpoint para cadastro de empresa

// Endpoint para cadastro de empresa com senha
app.post("/cadastrar-empresa", async (req, res) => {
  const {
    nome,
    categoria,
    descricao,
    endereco,
    cidade,
    bairro,
    telefone,
    email,
    atendimento,
    politica_cancelamento,
    senha, // Senha fornecida pelo frontend
  } = req.body;

  try {
    // Cadastrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    // Verifica se houve erro ao criar o usuário
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user?.id; // ID do usuário criado

    // Se o ID do usuário não for encontrado, retornar erro
    if (!userId) {
      return res.status(400).json({ error: "Erro ao obter ID do usuário." });
    }

    // Inserir empresa na tabela 'entidades' associando com o userId
    const { data, error } = await supabase.from("entidades").insert([
      {
        nome,
        categoria,
        descricao,
        endereco,
        cidade,
        bairro,
        telefone,
        email,
        forma_atendimento: atendimento,
        politica_cancelamento,
        tipo: "empresa", // Garantir que seja do tipo 'empresa'
        user_id: userId, // Associando a empresa ao usuário criado
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Empresa cadastrada com sucesso!", data });
  } catch (err) {
    console.error("Erro ao cadastrar empresa:", err);
    res.status(500).json({ error: err.message });
  }
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
  const { email, name, phone, dataNascimento, foto } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  console.log(`Buscando usuário com email: ${email}`);

  // Verifica se o usuário existe
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !user) {
    console.error("Usuário não encontrado:", userError);
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  // Atualiza os dados
  const { error } = await supabase
    .from("users")
    .update({ name, phone, dataNascimento, foto })
    .eq("email", email);

  if (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Perfil atualizado com sucesso!" });
});

const multer = require("multer");
const upload = multer(); // armazena em memória (pode personalizar)

// Rota para upload de imagem
app.post("/upload-foto", upload.single("foto"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado." });
  }

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = `avatars/imagens/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData, error: urlError } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (urlError) {
      throw urlError;
    }

    res.status(200).json({ publicUrl: publicData.publicUrl });
  } catch (err) {
    console.error("Erro ao fazer upload da imagem:", err.message);
    res.status(500).json({ error: "Erro ao fazer upload da imagem." });
  }
});

///////
//
//
//
//
//
//agendamento
// Endpoint para criar um agendamento
app.post("/agendar", async (req, res) => {
  const {
    user_id, // ID do usuário (deve ser fornecido ou obtido)
    entidades_id, // ID da entidade
    nome,
    email,
    telefone,
    appointment_date, // Data do agendamento
    appointment_time, // Hora do agendamento
    selected_services, // Serviços selecionados
  } = req.body;

  if (
    !user_id ||
    !entidades_id ||
    !selected_services ||
    selected_services.length === 0
  ) {
    return res.status(400).json({
      error:
        "Dados inválidos. Certifique-se de fornecer todos os dados necessários.",
    });
  }

  try {
    // Inserir o agendamento na tabela 'appointments'
    const { data, error } = await supabase.from("appointments").insert([
      {
        user_id,
        entidades_id,
        appointment_date,
        appointment_time,
        status: "pendente", // Status inicial pode ser "pendente"
        nome,
        email,
        telefone,
        payment_method: null, // Se necessário, pode ser modificado
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const appointmentId = data[0].id; // ID do agendamento criado

    // Inserir serviços relacionados ao agendamento
    const { error: servicesError } = await supabase
      .from("appointments_services")
      .insert(
        selected_services.map(serviceId => ({
          appointment_id: appointmentId,
          service_id: serviceId,
        }))
      );

    if (servicesError) {
      return res
        .status(400)
        .json({ error: "Erro ao associar serviços ao agendamento." });
    }

    res
      .status(201)
      .json({ message: "Agendamento realizado com sucesso!", data });
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    res.status(500).json({ error: err.message });
  }
});
