export default {
    async fetch(request, env) {
      // Get the origin from the request
      const origin = request.headers.get("Origin");
      const allowedOrigins = [
        "https://jondoran.github.io",               // GitHub Pages
        "https://fantastic-doodle-4wvp9rjjrqj27px5-8000.app.github.dev"  // Codespace
      ];
  
      // Check if the origin is allowed
      const corsHeaders = {
        "Access-Control-Allow-Methods": "POST, GET",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      };
  
      // Add Access-Control-Allow-Origin if origin is allowed
      if (allowedOrigins.includes(origin)) {
        corsHeaders["Access-Control-Allow-Origin"] = origin;
      }
  
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
  
      if (request.method !== "POST") {
        return new Response("Method not allowed", { 
          status: 405,
          headers: corsHeaders
        });
      }
  
      try {
        const { messages } = await request.json();
  
        // Create a thread with v2
        const threadResponse = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          },
          body: JSON.stringify({})
        });
  
        if (!threadResponse.ok) {
          throw new Error(`Thread creation failed: ${await threadResponse.text()}`);
        }
  
        const thread = await threadResponse.json();
  
        // Add message to thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          },
          body: JSON.stringify({
            role: "user",
            content: messages[messages.length - 1].content
          })
        });
  
        if (!messageResponse.ok) {
          throw new Error(`Message creation failed: ${await messageResponse.text()}`);
        }
  
        // Run the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          },
          body: JSON.stringify({
            assistant_id: env.ASSISTANT_ID
          })
        });
  
        if (!runResponse.ok) {
          throw new Error(`Run creation failed: ${await runResponse.text()}`);
        }
  
        const run = await runResponse.json();
  
        // Poll for completion
        let runStatus;
        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
  
          const statusResponse = await fetch(
            `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
            {
              headers: {
                "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2"
              }
            }
          );
  
          if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${await statusResponse.text()}`);
          }
  
          runStatus = await statusResponse.json();
        } while (runStatus.status === "in_progress" || runStatus.status === "queued");
  
        // Get the messages
        const messagesResponse = await fetch(
          `https://api.openai.com/v1/threads/${thread.id}/messages`,
          {
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2"
            }
          }
        );
  
        if (!messagesResponse.ok) {
          throw new Error(`Messages retrieval failed: ${await messagesResponse.text()}`);
        }
  
        const messages_data = await messagesResponse.json();
        const assistant_message = messages_data.data[0];
  
        // Format response to match expected structure
        const response_data = {
          choices: [{
            message: {
              content: assistant_message.content[0].text.value
            }
          }]
        };
  
        return new Response(JSON.stringify(response_data), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
        });
  
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
        });
      }
    },
  };
  