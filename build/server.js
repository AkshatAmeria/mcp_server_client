// import {
//   McpServer,
//   ResourceTemplate,
// } from "@modelcontextprotocol/sdk/server/mcp.js"
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
// import { z } from "zod"
// import fs from "node:fs/promises"
// import path from "node:path"
// import { fileURLToPath } from "node:url"
// import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js"
// const server = new McpServer({
//   name: "test-video",
//   version: "1.0.0",
//   capabilities: {
//     resources: {},
//     tools: {},
//     prompts: {},
//   },
// })
// server.resource(
//   "users",
//   "users://all",
//   {
//     description: "Get all users data from the database",
//     title: "Users",
//     mimeType: "application/json",
//   },
//   async uri => {
//     const users = await import("./data/users.json", {
//       with: { type: "json" },
//     }).then(m => m.default)
//     return {
//       contents: [
//         {
//           uri: uri.href,
//           text: JSON.stringify(users),
//           mimeType: "application/json",
//         },
//       ],
//     }
//   }
// )
// server.resource(
//   "user-details",
//   new ResourceTemplate("users://{userId}/profile", { list: undefined }),
//   {
//     description: "Get a user's details from the database",
//     title: "User Details",
//     mimeType: "application/json",
//   },
//   async (uri, { userId }) => {
//     const users = await import("./data/users.json", {
//       with: { type: "json" },
//     }).then(m => m.default)
//     const user = users.find(u => u.id === parseInt(userId as string))
//     if (user == null) {
//       return {
//         contents: [
//           {
//             uri: uri.href,
//             text: JSON.stringify({ error: "User not found" }),
//             mimeType: "application/json",
//           },
//         ],
//       }
//     }
//     return {
//       contents: [
//         {
//           uri: uri.href,
//           text: JSON.stringify(user),
//           mimeType: "application/json",
//         },
//       ],
//     }
//   }
// )
// server.tool(
//   "create-user",
//   "Create a new user in the database",
//   {
//     name: z.string(),
//     email: z.string(),
//     address: z.string(),
//     phone: z.string(),
//   },
//   {
//     title: "Create User",
//     readOnlyHint: false,
//     destructiveHint: false,
//     idempotentHint: false,
//     openWorldHint: true,
//   },
//   async params => {
//       try {
//         const id = await createUser(params)
//         return {
//           content: [{ type: "text", text: `User ${id} created successfully` }],
//         }
//       } catch (err: any) {
//         // Surface the error message to help debug why saving failed (temporary)
//         const msg = err?.message ?? "Failed to save user"
//         return {
//           content: [{ type: "text", text: `Failed to save user: ${msg}` }],
//         }
//       }
//   }
// )
// server.tool(
//   "create-random-user",
//   "Create a random user with fake data",
//   {
//     title: "Create Random User",
//     readOnlyHint: false,
//     destructiveHint: false,
//     idempotentHint: false,
//     openWorldHint: true,
//   },
//   async () => {
//     const res = await server.server.request(
//       {
//         method: "sampling/createMessage",
//         params: {
//           messages: [
//             {
//               role: "user",
//               content: {
//                 type: "text",
//                 text: "Generate fake user data. The user should have a realistic name, email, address, and phone number. Return this data as a JSON object with no other text or formatter so it can be used with JSON.parse.",
//               },
//             },
//           ],
//           maxTokens: 1024,
//         },
//       },
//       CreateMessageResultSchema
//     )
//     if (res.content.type !== "text") {
//       return {
//         content: [{ type: "text", text: "Failed to generate user data" }],
//       }
//     }
//     try {
//       const fakeUser = JSON.parse(
//         res.content.text
//           .trim()
//           .replace(/^```json/, "")
//           .replace(/```$/, "")
//           .trim()
//       )
//       const id = await createUser(fakeUser)
//       return {
//         content: [{ type: "text", text: `User ${id} created successfully` }],
//       }
//     } catch {
//       return {
//         content: [{ type: "text", text: "Failed to generate user data" }],
//       }
//     }
//   }
// )
// server.prompt(
//   "generate-fake-user",
//   "Generate a fake user based on a given name",
//   {
//     name: z.string(),
//   },
//   ({ name }) => {
//     return {
//       messages: [
//         {
//           role: "user",
//           content: {
//             type: "text",
//             text: `Generate a fake user with the name ${name}. The user should have a realistic email, address, and phone number.`,
//           },
//         },
//       ],
//     }
//   }
// )
// async function createUser(user: {
//   name: string
//   email: string
//   address: string
//   phone: string
// }) {
//   // Resolve an absolute path to the data file so reads/writes work from any CWD
//   // Use process.cwd() to stay compatible with the project's compilation target
//   const dataFile = path.resolve(process.cwd(), "src", "data", "users.json")
//   // Read current users
//   const raw = await fs.readFile(dataFile, "utf8")
//   const users: Array<any> = JSON.parse(raw)
//   const id = users.length + 1
//   users.push({ id, ...user })
//   // Write atomically: write to temp file then rename
//   const tmpFile = `${dataFile}.tmp`
//   try {
//     await fs.writeFile(tmpFile, JSON.stringify(users, null, 2), { encoding: "utf8" })
//     await fs.rename(tmpFile, dataFile)
//   } catch (err) {
//     // Attempt to clean up temp file if present, but ignore errors here
//     try {
//       await fs.unlink(tmpFile)
//     } catch {}
//     // Re-throw a descriptive error for callers to handle
//     throw new Error(`write-failed: ${String(err)}`)
//   }
//   return id
// }
// async function main() {
//   const transport = new StdioServerTransport()
//   await server.connect(transport)
// }
// main()
// FILE: src/server.ts
// ============================================
import { McpServer, ResourceTemplate, } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
const server = new McpServer({
    name: "test-video",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
// Helper function to get the data file path
function getDataFilePath() {
    return path.resolve(process.cwd(), "src", "data", "users.json");
}
// Helper function to read users from the JSON file
async function readUsers() {
    try {
        const dataFile = getDataFilePath();
        const raw = await fs.readFile(dataFile, "utf8");
        return JSON.parse(raw);
    }
    catch (error) {
        // If file doesn't exist, return empty array
        return [];
    }
}
server.resource("users", "users://all", {
    description: "Get all users data from the database",
    title: "Users",
    mimeType: "application/json",
}, async (uri) => {
    const users = await readUsers();
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(users, null, 2),
                mimeType: "application/json",
            },
        ],
    };
});
server.resource("user-details", new ResourceTemplate("users://{userId}/profile", { list: undefined }), {
    description: "Get a user's details from the database",
    title: "User Details",
    mimeType: "application/json",
}, async (uri, { userId }) => {
    const users = await readUsers();
    const user = users.find(u => u.id === parseInt(userId));
    if (user == null) {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify({ error: "User not found" }),
                    mimeType: "application/json",
                },
            ],
        };
    }
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(user, null, 2),
                mimeType: "application/json",
            },
        ],
    };
});
server.tool("create-user", "Create a new user in the database", {
    name: z.string(),
    email: z.string(),
    address: z.string(),
    phone: z.string(),
}, {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async (params) => {
    try {
        const id = await createUser(params);
        return {
            content: [{ type: "text", text: `User ${id} created successfully` }],
        };
    }
    catch (err) {
        const msg = err?.message ?? "Failed to save user";
        return {
            content: [{ type: "text", text: `Failed to save user: ${msg}` }],
            isError: true,
        };
    }
});
server.tool("create-random-user", "Create a random user with fake data", {}, {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async () => {
    try {
        const res = await server.server.request({
            method: "sampling/createMessage",
            params: {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: "Generate fake user data. The user should have a realistic name, email, address, and phone number. Return this data as a JSON object with no other text or formatting so it can be used with JSON.parse.",
                        },
                    },
                ],
                maxTokens: 1024,
            },
        }, CreateMessageResultSchema);
        if (res.content.type !== "text") {
            return {
                content: [{ type: "text", text: "Failed to generate user data" }],
                isError: true,
            };
        }
        const fakeUser = JSON.parse(res.content.text
            .trim()
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim());
        const id = await createUser(fakeUser);
        return {
            content: [
                {
                    type: "text",
                    text: `Random user ${id} created successfully with name: ${fakeUser.name}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to create random user: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
            ],
            isError: true,
        };
    }
});
server.prompt("generate-fake-user", "Generate a fake user based on a given name", {
    name: z.string(),
}, ({ name }) => {
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate a fake user with the name ${name}. The user should have a realistic email, address, and phone number. Return the data as a JSON object.`,
                },
            },
        ],
    };
});
async function createUser(user) {
    const dataFile = getDataFilePath();
    // Ensure the data directory exists
    const dataDir = path.dirname(dataFile);
    await fs.mkdir(dataDir, { recursive: true });
    // Read current users
    const users = await readUsers();
    const id = users.length + 1;
    users.push({ id, ...user });
    // Write atomically: write to temp file then rename
    const tmpFile = `${dataFile}.tmp`;
    try {
        await fs.writeFile(tmpFile, JSON.stringify(users, null, 2), {
            encoding: "utf8",
        });
        await fs.rename(tmpFile, dataFile);
    }
    catch (err) {
        // Attempt to clean up temp file if present, but ignore errors here
        try {
            await fs.unlink(tmpFile);
        }
        catch { }
        throw new Error(`write-failed: ${String(err)}`);
    }
    return id;
}
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server is running..."); // Log to stderr to avoid interfering with stdio transport
}
main().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map