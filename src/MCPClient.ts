import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private command: string;
  private args: string[]

  constructor(name: string, command: string, args: string[], version: string = "1.0.0" ) {
    this.mcp = new Client({ name, version });
    this.command = command;
    this.args = args;
  }
  
  public async init() {
    await this.connectToServer();
  }

  public async close() {
      await this.mcp.close();
  }

  public getTools() {
      return this.tools;
  }

  public callTool(name: string, params: Record<string, any>) {
      return this.mcp.callTool({
          name,
          arguments: params,
      });
  }

  async connectToServer() {
    try {
      this.transport = new StdioClientTransport({
        command: this.command,
        args: this.args,
      });
      await this.mcp.connect(this.transport);
      
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        };
      });
      console.log(
        "已连接到服务器，工具包括：",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.log("无法连接到 MCP 服务器: ", e);
      throw e;
    }
  }
}

export default MCPClient;