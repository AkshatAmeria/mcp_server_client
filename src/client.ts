import "dotenv/config"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { confirm, input, select } from "@inquirer/prompts"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import {
  CreateMessageRequestSchema,
  Prompt,
  PromptMessage,
  Tool,
} from "@modelcontextprotocol/sdk/types.js"
import { generateText, jsonSchema, ToolSet } from "ai"

const mcp = new Client(
  {
    name: "text-client-mcp",
    version: "1.0.0",
  },
  { capabilities: { sampling: {} } }
)

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/server.js"],
  stderr: "ignore",
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function main() {
  try {
    await mcp.connect(transport)
    console.log("✅ You are connected to the MCP server!\n")

    const [{ tools }, { prompts }, { resources }, { resourceTemplates }] =
      await Promise.all([
        mcp.listTools(),
        mcp.listPrompts(),
        mcp.listResources(),
        mcp.listResourceTemplates(),
      ])

    // = server to call back
    mcp.setRequestHandler(CreateMessageRequestSchema, async request => {
      const texts: string[] = []
      for (const message of request.params.messages) {
        const text = await handleServerMessagePrompt(message)
        if (text != null) texts.push(text)
      }

      return {
        role: "user",
        model: "gemini-2.0-flash",
        stopReason: "endTurn",
        content: {
          type: "text",
          text: texts.join("\n"),
        },
      }
    })

    while (true) {
      const option = await select({
        message: "What would you like to do?",
        choices: [
          { name: "Query (AI-powered)", value: "Query" },
          { name: "Call a Tool", value: "Tools" },
          { name: "Read a Resource", value: "Resources" },
          { name: "Use a Prompt", value: "Prompts" },
          { name: "Exit", value: "Exit" },
        ],
      })

      if (option === "Exit") {
        console.log("Goodbye!")
        process.exit(0)
      }

      try {
        switch (option) {
          case "Tools":
            if (tools.length === 0) {
              console.log("No tools available.")
              break
            }
            const toolName = await select({
              message: "Select a tool:",
              choices: tools.map(tool => ({
                name: tool.annotations?.title || tool.name,
                value: tool.name,
                description: tool.description,
              })),
            })
            const tool = tools.find(t => t.name === toolName)
            if (tool == null) {
              console.error("Tool not found.")
            } else {
              await handleTool(tool)
            }
            break

          case "Resources":
            const allResources = [
              ...resources.map(resource => ({
                name: resource.name,
                value: resource.uri,
                description: resource.description,
              })),
              ...resourceTemplates.map(template => ({
                name: template.name,
                value: template.uriTemplate,
                description: template.description,
              })),
            ]

            if (allResources.length === 0) {
              console.log("No resources available.")
              break
            }

            const resourceUri = await select({
              message: "Select a resource:",
              choices: allResources,
            })

            const uri =
              resources.find(r => r.uri === resourceUri)?.uri ??
              resourceTemplates.find(r => r.uriTemplate === resourceUri)
                ?.uriTemplate

            if (uri == null) {
              console.error("Resource not found.")
            } else {
              await handleResource(uri)
            }
            break

          case "Prompts":
            if (prompts.length === 0) {
              console.log("No prompts available.")
              break
            }
            const promptName = await select({
              message: "Select a prompt:",
              choices: prompts.map(prompt => ({
                name: prompt.name,
                value: prompt.name,
                description: prompt.description,
              })),
            })
            const prompt = prompts.find(p => p.name === promptName)
            if (prompt == null) {
              console.error("Prompt not found.")
            } else {
              await handlePrompt(prompt)
            }
            break

          case "Query":
            await handleQuery(tools)
            break
        }
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error)
      }

      console.log("\n" + "=".repeat(50) + "\n")
    }
  } catch (error) {
    console.error("Failed to connect to MCP server:", error)
    process.exit(1)
  }
}

async function handleQuery(tools: Tool[]) {
  const query = await input({ message: "Enter your query:" })

  console.log("\n Processing your query...\n")

  const { text, toolResults } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: query,
    tools: tools.reduce(
      (obj, tool) => ({
        ...obj,
        [tool.name]: {
          description: tool.description,
          parameters: jsonSchema(tool.inputSchema),
          execute: async (args: Record<string, any>) => {
            console.log(`🔧 Calling tool: ${tool.name}`)
            return await mcp.callTool({
              name: tool.name,
              arguments: args,
            })
          },
        },
      }),
      {} as ToolSet
    ),
  })

  console.log("\n📝 Response:")
  console.log(
    text ||
      // @ts-expect-error
      toolResults[0]?.result?.content[0]?.text ||
      "No text generated."
  )
}

async function handleTool(tool: Tool) {
  const args: Record<string, string> = {}

  // Collect arguments if the tool has input parameters
  if (tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0) {
    for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
      args[key] = await input({
        message: `Enter value for ${key} (${(value as { type: string }).type}):`,
      })
    }
  }

  console.log(`\n🔧 Calling tool: ${tool.name}...\n`)

  const res = await mcp.callTool({
    name: tool.name,
    arguments: args,
  })

  console.log("Result:")
  console.log((res.content as [{ text: string }])[0].text)
}

async function handleResource(uri: string) {
  let finalUri = uri
  const paramMatches = uri.match(/{([^}]+)}/g)

  // If URI has parameters, collect them from user
  if (paramMatches != null) {
    for (const paramMatch of paramMatches) {
      const paramName = paramMatch.replace("{", "").replace("}", "")
      const paramValue = await input({
        message: `Enter value for ${paramName}:`,
      })
      finalUri = finalUri.replace(paramMatch, paramValue)
    }
  }

  console.log(`\n Reading resource: ${finalUri}...\n`)

  const res = await mcp.readResource({
    uri: finalUri,
  })

  console.log("Resource content:")
  console.log(
    JSON.stringify(JSON.parse(res.contents[0].text as string), null, 2)
  )
}

async function handlePrompt(prompt: Prompt) {
  const args: Record<string, string> = {}

  // Collect prompt arguments
  for (const arg of prompt.arguments ?? []) {
    args[arg.name] = await input({
      message: `Enter value for ${arg.name}:`,
    })
  }

  const response = await mcp.getPrompt({
    name: prompt.name,
    arguments: args,
  })

  for (const message of response.messages) {
    await handleServerMessagePrompt(message)
  }
}

async function handleServerMessagePrompt(message: PromptMessage) {
  if (message.content.type !== "text") return

  console.log("\n Prompt:")
  console.log(message.content.text)

  const run = await confirm({
    message: "Would you like to run the above prompt?",
    default: true,
  })

  if (!run) return

  console.log("\n Generating response...\n")

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: message.content.text,
  })

  console.log("Response:")
  console.log(text)

  return text
}

main()