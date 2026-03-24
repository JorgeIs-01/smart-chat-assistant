// =============================================
// CONFIGURACIÓN CENTRAL DE LA APLICACIÓN RAG
// =============================================
// Modifica estas variables para conectar a tus servicios.
// En producción, usa variables de entorno (.env).
// Lovable no soporta .env, así que los valores se definen aquí.

export const config = {
  // --- SUPABASE ---
  // URL de tu proyecto Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://tu-proyecto.supabase.co",
  // Clave pública (anon key) de Supabase
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "tu-anon-key",

  // --- OLLAMA (IA LOCAL) ---
  // Endpoint de tu instancia de Ollama (o URL de servidor proxy)
  ollamaUrl: import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434",
  // Modelo para generar embeddings (768 dimensiones)
  embeddingModel: import.meta.env.VITE_OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
  // Modelo para generar respuestas
  chatModel: import.meta.env.VITE_OLLAMA_CHAT_MODEL || "llama3.1",

  // --- ADMIN ---
  // Contraseña para acceder al panel de administración
  // NOTA DE SEGURIDAD: En producción, usa autenticación real.
  adminPassword: "admin123",

  // --- RAG ---
  // Número de chunks a recuperar por consulta
  topK: 5,
  // Umbral de similitud mínima (0-1)
  similarityThreshold: 0.3,
} as const;
