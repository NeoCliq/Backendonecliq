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

  // Tenta login diretamente
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();

    // E-mail não confirmado
    if (msg.includes("email not confirmed")) {
      return res.status(403).json({ error: "email not confirmed" });
    }

    // E-mail não existe ou senha incorreta (não tem como distinguir com certeza)
    return res.status(401).json({ error: "invalid credentials" });
  }

  // Login OK
  res.json(data);
});

// cria rota para cadastro de usuário//
app.post("/register", async (req, res) => {
  const { email, password, name, surname, tipo } = req.body;

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
        .update({ name, surname, tipo })
        .eq("id", userId);

      if (updateError) throw updateError;
    } else {
      // Insere novo registro com name e surname
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          name,
          surname,
          tipo,

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
        email,
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

    // 3. Adiciona o tipo na tabela 'users'
    const { error: userInsertError } = await supabase.from("users").insert([
      {
        id,
        tipo,
      },
    ]);

    if (userInsertError)
      return res.status(500).json({ error: userInsertError.message });

    res
      .status(201)
      .json({ message: "Entidade cadastrada com sucesso!", authData, email });
  } catch (err) {
    console.error("Erro ao cadastrar entidade:", err);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

//verifica se o email já tem
app.post("/verifica-email", async (req, res) => {
  const { email } = req.body;

  try {
    const { data, error } = await supabase
      .from("users") // Consulta a TABELA DE CLIENTES
      .select("email")
      .eq("email", email)
      .single(); // só queremos um resultado

    if (error && error.code !== "PGRST116") {
      // PGRST116 é "No rows found" — tratamos como "não existe"
      throw error;
    }

    return res.status(200).json({ exists: !!data });
  } catch (err) {
    console.error("Erro ao verificar e-mail:", err);
    return res.status(500).json({ error: "Erro ao verificar e-mail" });
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
// Rota para criar um agendamento
app.post("/agendar", async (req, res) => {
  const {
    user_id,
    entidade_id,
    service_ids, // array de UUIDs dos serviços
    data,
    horario,
    nome,
    telefone,
    email,
  } = req.body;

  console.log("📥 Agendamento recebido:", {
    user_id,
    entidade_id,
    service_ids,
    data,
    horario,
    nome,
    telefone,
    email,
  });

  // Verificação de campos obrigatórios
  if (
    !user_id ||
    !entidade_id ||
    !data ||
    !horario ||
    !service_ids ||
    !Array.isArray(service_ids) ||
    service_ids.length === 0
  ) {
    console.warn("❗Campos obrigatórios faltando ou inválidos");
    return res
      .status(400)
      .json({ error: "Campos obrigatórios ausentes ou inválidos." });
  }

  // Cria o payload do agendamento
  const payload = {
    user_id,
    entidade_id,
    data,
    horario,
    nome,
    telefone,
    email,
  };

  try {
    // Inserir agendamento
    const { data: agendamentoData, error: agendamentoError } = await supabase
      .from("appointments")
      .insert([payload])
      .select()
      .single(); // pega um único agendamento

    if (agendamentoError) {
      console.error("❌ Erro ao inserir agendamento:", agendamentoError);
      return res.status(500).json({ error: "Erro ao criar agendamento." });
    }

    const agendamento_id = agendamentoData.id;

    // Cria os relacionamentos com os serviços
    const servicosRelacionados = service_ids
      .filter(id => /^[0-9a-fA-F-]{36}$/.test(id)) // valida os UUIDs
      .map(service_id => ({
        appointment_id: agendamento_id,
        service_id,
      }));

    if (servicosRelacionados.length === 0) {
      console.warn("⚠️ Nenhum service_id válido fornecido");
      return res
        .status(400)
        .json({ error: "Nenhum serviço válido fornecido." });
    }

    const { error: servicoError } = await supabase
      .from("appointment_services")
      .insert(servicosRelacionados);

    if (servicoError) {
      console.error("❌ Erro ao inserir serviços:", servicoError);
      return res
        .status(500)
        .json({ error: "Erro ao vincular serviços ao agendamento." });
    }

    console.log("✅ Agendamento e serviços inseridos com sucesso");

    res.status(201).json({ message: "Agendamento criado com sucesso!" });
  } catch (err) {
    console.error("🔥 Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno ao criar agendamento." });
  }
});

// Rota pública para buscar dados de um profissional (sem precisar de autenticação)
// Rota para puxar a entidade com base no user_id (usuário autenticado)
app.get("/entidade/me", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id é obrigatório" });
  }

  const { data, error } = await supabase
    .from("entidades")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res
      .status(404)
      .json({ error: "Entidade não encontrada para esse usuário." });
  }

  res.json(data);
});

app.get("/entidade/publica/:id", async (req, res) => {
  const { id } = req.params;

  // Consulta a tabela de entidades com tipo "profissional"
  const { data, error } = await supabase
    .from("entidades")
    .select(
      `
      nome,
      nome_profissional,
      formacao,
      profissao,
      especialidades,
      endereco,
      cidade,
      bairro,
      maps,
      forma_atendimento
    `
    )
    .eq("id", id)
    .eq("tipo", "profissional")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Profissional não encontrado." });
  }

  // Preferência por nome_profissional e formacao
  const nomeFinal = data.nome_profissional || data.nome;
  const formacaoFinal = data.formacao || data.profissao;

  const resposta = {
    nome: nomeFinal,
    formacao: formacaoFinal,
    especialidades: data.especialidades,
    endereco: data.endereco,
    cidade: data.cidade,
    bairro: data.bairro,
    maps: data.maps,
    forma_atendimento: data.forma_atendimento, // 👈 adicionado aqui
  };

  res.json(resposta);
});

// Lista todas as entidades
app.get("/entidade", async (req, res) => {
  try {
    const { data, error } = await supabase.from("entidades").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Puxa os dados de uma entidade pelo ID
app.get("/entidade/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("entidades")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

//
//
//Mostrar os agendamento de cada usuário no front

app.get("/agendamentos/:userId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const userIdParam = req.params.userId;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // Verifica o token no Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  // Garante que o user está acessando apenas seus próprios dados
  if (user.id !== userIdParam) {
    return res.status(403).json({ error: "Acesso não autorizado." });
  }

  // Consulta segura
  const { data: agendamentos, error: queryError } = await supabase
    .from("appointments")
    .select(
      `
    *,
    entidade:entidade_id (
      nome,
      nome_profissional,
      categoria,
      profissao,
      endereco,
      bairro,
      cidade
    )
  `
    )
    .eq("user_id", userIdParam)
    .order("data", { ascending: false });

  if (queryError) {
    return res.status(500).json({ error: "Erro ao buscar agendamentos." });
  }

  res.json(agendamentos);
});
// Importa as dependências necessárias

// Buscar todos os serviços de uma entidade
app.get("/entidade/servicos/:entidadeId", async (req, res) => {
  const { entidadeId } = req.params; // Pega o `entidadeId` da URL da requisição

  // Faz a consulta no Supabase para pegar todos os serviços daquela entidade
  const { data, error } = await supabase
    .from("services") // Nome da tabela no banco de dados
    .select("*") // Seleciona todos os campos da tabela "services"
    .eq("entidade_id", entidadeId) // Filtra pelo `entidade_id` que foi passado na URL
    .order("created_at", { ascending: false }); // Ordena pela data de criação, se necessário

  // Se houver erro na consulta, retorna um erro 500
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Caso a consulta seja bem-sucedida, retorna os serviços da entidade
  res.json(data);
});

//essa parte consulta os agendamemto de uma entidade:
// Buscar horários ocupados de uma entidade
app.get("/entidade/horarios-ocupados/:entidadeId", async (req, res) => {
  const { entidadeId } = req.params;

  // Consulta a VIEW 'horarios_ocupados' no Supabase
  const { data, error } = await supabase
    .from("horarios_ocupados") // Usa a VIEW segura
    .select("data, horario") // Apenas os campos expostos pela view
    .eq("entidade_id", entidadeId)
    .order("data", { ascending: true }); // Opcional: ordena por data

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data); // Retorna os horários ocupados da entidade
});
