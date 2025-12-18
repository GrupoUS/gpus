import { v } from "convex/values";
import { action } from "../_generated/server";
import { createAsaasClient } from "../lib/asaas";
import axios from "axios";

export const testAsaasConnection = action({
  args: {
    apiKey: v.string(),
    baseUrl: v.string()
  },
  handler: async (_ctx, args) => {
    try {
      const client = createAsaasClient({
        apiKey: args.apiKey,
        baseUrl: args.baseUrl
      });

      // testConnection makes a lightweight call (e.g. list customers limit=1)
      await client.testConnection();

      return {
        success: true,
        message: "Conexão com Asaas estabelecida com sucesso."
      };
    } catch (error: any) {
      console.error("Asaas connection test failed:", error.message);
      let message = "Falha na conexão com Asaas.";

      if (error.response) {
         if (error.response.status === 401) {
             message = "Erro de autenticação: API Key inválida.";
         } else if (error.response.status === 404) {
             message = "URL base incorreta ou endpoint não encontrado.";
         } else {
             message = `Erro na API (${error.response.status}): ${JSON.stringify(error.response.data)}`;
         }
      } else if (error.code === 'ECONNABORTED') {
          message = "Timeout na conexão.";
      } else if (error.code === 'ENOTFOUND') {
          message = "URL base inalcançável.";
      }

      return {
        success: false,
        message,
        details: error.message
      };
    }
  }
});

export const testEvolutionConnection = action({
  args: {
    apiKey: v.string(),
    apiUrl: v.string(),
    instanceName: v.string()
  },
  handler: async (_ctx, args) => {
    try {
      // Endpoint: GET /instance/connectionState/{instanceName}
      // Need to construct full URL carefully
      let baseUrl = args.apiUrl.replace(/\/$/, "");
      const url = `${baseUrl}/instance/connectionState/${args.instanceName}`;

      const response = await axios.get(url, {
        headers: {
            "apikey": args.apiKey
        },
        timeout: 10000
      });

      if (response.status === 200) {
          // Check body if specific state is needed?
          // Usually getting 200 means connection and auth worked.
          return {
              success: true,
              message: "Conexão com Evolution API estabelecida com sucesso."
          };
      }

      return {
        success: false,
        message: `Status inesperado: ${response.status}`
      };

    } catch (error: any) {
      console.error("Evolution connection test failed:", error.message);
      let message = "Falha na conexão com Evolution API.";

      if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
             message = "Acesso negado: Verifique sua API Key.";
          } else if (error.response.status === 404) {
             message = "Instância não encontrada ou URL incorreta.";
          }
      }

      return {
          success: false,
          message,
          details: error.message
      };
    }
  }
});

export const testDifyConnection = action({
  args: {
    apiKey: v.string(),
    apiUrl: v.string(),
    appId: v.string()
  },
  handler: async (_ctx, args) => {
    try {
      // Endpoint: GET /info or /parameters?
      // Dify API usually requires "Authorization: Bearer " + apiKey
      // Common endpoint to check app availability: GET /parameters? (User plan suggested /info)
      // I'll try /info if not /parameters

      let baseUrl = args.apiUrl.replace(/\/$/, "");
      // Assuming baseUrl ends with /v1 or similar.
      // E.g. https://api.dify.ai/v1

      // We'll try to get Application meta or similar.
      const url = `${baseUrl}/parameters`; // Often available for accessing app parameters

      await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${args.apiKey}`
        },
        timeout: 10000
      });

      // If we get 200, it's good.
      return {
           success: true,
           message: "Conexão com Dify AI estabelecida com sucesso."
      };

    } catch (error: any) {
        // Fallback: Try another endpoint if first fails?
        // Or handle standard errors.
        console.error("Dify connection test failed:", error.message);
        let message = "Falha na conexão com Dify AI.";

        if (error.response) {
            if (error.response.status === 401) {
                message = "Erro de autenticação: API Key inválida.";
            } else if (error.response.status === 404) {
                message = "URL API ou App ID incorreto.";
            }
        }

        return {
             success: false,
             message,
             details: error.message
        };
    }
  }
});
