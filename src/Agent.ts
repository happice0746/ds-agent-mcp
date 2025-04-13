import ChatDeepSeek from "./ChatDeepSeek";
import { logTitle } from "./logUtils";
import MCPClient from "./MCPClient";

class Agent {
  private llm: ChatDeepSeek | null = null;
  private mcpClients: MCPClient[];
  private model: string;
  private prompt: string;
  private context: string;
  
  constructor(model: string = "", prompt: string = "", mcpClients: MCPClient[], context: string) {
    this.mcpClients = mcpClients;
    this.model = model;
    this.prompt = prompt;
    this.context = context;
  }

  public async init() {
    logTitle("INIT")

    for (const mcpClient of this.mcpClients) {
      await mcpClient.init();
    }
    const tools = this.mcpClients.flatMap(mcpClient => mcpClient.getTools());
    this.llm = new ChatDeepSeek(this.model, this.prompt, tools, this.context);
  }

  private async close() {
    for (const mcpClient of this.mcpClients) {
      await mcpClient.close();
    }
  }
  
  public async invoke(prompt: string = "") {
    if (!this.llm) throw new Error("llm isnt init");
    console.log("INVOKE")
    let response = await this.llm.chat(prompt);
    console.log("length: ", response.toolCalls.length)
    while (true) {
      if (response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          console.log("toolCallID: ",toolCall.id)
          const mcp = this.mcpClients.find(mcpClient => mcpClient.getTools().find(tool => tool.name === toolCall.function.name));
          if (mcp) {
            logTitle("TOOL USE " + toolCall.function.name)
            const toolUseRes = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
            this.llm.appendToolResult(toolCall.id, JSON.stringify(toolUseRes));
          } else {
            this.llm.appendToolResult(toolCall.id, "Tool not found")
          }
        }
        response = await this.llm.chat();
        continue;
      }
      await this.close();
      return response.content;
    }
  }
}

export default Agent;