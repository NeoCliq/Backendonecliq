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
// cria rota para cadastro de usuário//
app.post("/register", async (req, res) => {
  const { email, password, name, surname } = req.body;

  try {
    // Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Salva 'name' no auth.users
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "Erro ao obter ID do usuário." });
    }

    // Verifica se já existe na tabela users
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      // Atualiza name e surname se já existir
      const { error: updateError } = await supabase
        .from("users")
        .update({ name, surname })
        .eq("id", userId);

      if (updateError) throw updateError;
    } else {
      // Insere novo registro com name e surname
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          name,
          surname,
          created_at: new Date(),
        },
      ]);

      if (insertError) throw insertError;
    }

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao registrar:", error);
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
// Cadastro de entidade (empresa ou profissional)
app.post("/entidade", async (req, res) => {
  const {
    email,
    password,
    nome,
    tipo,
    nome_profissional,
    categoria,
    especialidades,
    descricao,
    foto_url,
    endereco,
    cidade,
    bairro,
    atende_online,
    forma_atendimento,
    horarios,
    local_fixo,
    telefone,
    redes_sociais,
    metodos_pagamento,
    cnpj,
    fotos_estrutura,
    planos_assinatura,
    formacao,
    experiencia,
    documento,
    certificado_url,
    permite_avaliacoes,
    termos_aceitos,
  } = req.body;

  try {
    // 1. Cria usuário no auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: nome }, // Salva nome como "Display Name"
      },
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user_id = authData.user?.id;
    if (!user_id)
      return res.status(500).json({ error: "Erro ao obter ID do usuário." });

    // 2. Insere dados na tabela 'entidades'
    const { error: insertError } = await supabase.from("entidades").insert([
      {
        user_id,
        tipo,
        nome,
        nome_profissional,
        categoria,
        especialidades,
        descricao,
        foto_url,
        endereco,
        cidade,
        bairro,
        atende_online,
        forma_atendimento,
        horarios,
        local_fixo,
        telefone,
        email, // mesmo email do auth
        redes_sociais,
        metodos_pagamento,
        cnpj,
        fotos_estrutura,
        planos_assinatura,
        formacao,
        experiencia,
        documento,
        certificado_url,
        permite_avaliacoes,
        termos_aceitos,
      },
    ]);

    if (insertError)
      return res.status(500).json({ error: insertError.message });

    res.status(201).json({ message: "Entidade cadastrada com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar entidade:", err);
    res.status(500).json({ error: "Erro interno no servidor." });
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
  const { email, name, surname, phone, dataNascimento, foto } = req.body; // ✅ incluiu surname

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

  // Atualiza os dados (✅ agora inclui surname)
  const { error } = await supabase
    .from("users")
    .update({ name, surname, phone, dataNascimento, foto })
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
