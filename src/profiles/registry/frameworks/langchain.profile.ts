import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const langchainProfile: Profile = {
  id: 'frameworks/langchain',
  name: 'LangChain',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['langchain'],
  contributions: {
    claudeMd: [
      {
        heading: 'LangChain Conventions',
        order: 25,
        content: `## LangChain Conventions

Framework for building LLM-powered applications. Use LCEL (LangChain Expression Language) for composing chains, prefer runnable interfaces, and always handle streaming and async.

**Detailed rules:** see \`.claude/rules/langchain/\` directory.

**Key rules:**
- Use LCEL (\`|\` pipe operator) to compose chains — avoid legacy \`LLMChain\` and \`SequentialChain\`
- Prefer \`ChatPromptTemplate.from_messages()\` with typed message roles
- Use \`RunnableParallel\`, \`RunnableLambda\`, \`RunnablePassthrough\` for branching and passthrough logic
- Always stream responses with \`.astream()\` for long-running LLM calls
- Use \`langchain_core\` imports (stable API) over \`langchain\` imports where possible`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
        ],
      },
    },
    rules: [
      {
        path: 'langchain/chains-and-lcel.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'LangChain LCEL composition, chains, and runnable patterns',
        content: `# LangChain Chains & LCEL

## LCEL — LangChain Expression Language
- Compose chains with the \`|\` pipe operator: \`prompt | llm | output_parser\`
- Every LCEL component implements the \`Runnable\` interface: \`.invoke()\`, \`.stream()\`, \`.batch()\`, \`.ainvoke()\`, \`.astream()\`
- Prefer async methods (\`ainvoke\`, \`astream\`) for I/O-bound LLM calls
- Use \`RunnablePassthrough\` to forward input fields unchanged through the chain
- Use \`RunnableParallel\` to run multiple branches concurrently and merge results
- Use \`RunnableLambda\` to wrap arbitrary Python functions as runnable steps

## Prompt Templates
- \`ChatPromptTemplate.from_messages([("system", "..."), ("human", "{input}")])\` for chat models
- \`PromptTemplate.from_template("...")\` for completion models
- Always use typed message tuples — never raw strings in \`from_messages\`
- Use \`MessagesPlaceholder\` to inject conversation history into prompts

## Output Parsers
- \`StrOutputParser\` for plain text output
- \`JsonOutputParser\` + \`PydanticOutputParser\` for structured output — always provide a schema
- \`CommaSeparatedListOutputParser\` for simple lists
- Attach format instructions to the prompt via \`parser.get_format_instructions()\`

## Avoid Legacy Patterns
- Do not use \`LLMChain\`, \`SequentialChain\`, \`SimpleSequentialChain\` — use LCEL instead
- Do not use \`ConversationChain\` — implement memory manually with \`RunnableWithMessageHistory\`
- Do not import from \`langchain.chains\` when \`langchain_core\` has an equivalent
`,
      },
      {
        path: 'langchain/memory-and-history.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'LangChain conversation memory and message history patterns',
        content: `# LangChain Memory & Conversation History

## RunnableWithMessageHistory
- Wrap any LCEL chain with \`RunnableWithMessageHistory\` to add stateful conversation
- Provide a \`get_session_history\` callable that returns a \`BaseChatMessageHistory\` given a session ID
- Pass \`input_messages_key\` and \`history_messages_key\` to map fields correctly
- Always pass \`config={"configurable": {"session_id": "..."}}\` when invoking

## Message History Backends
- \`ChatMessageHistory\` (in-memory) — development and testing only
- \`RedisChatMessageHistory\` — production, TTL-based expiry
- \`SQLChatMessageHistory\` — relational DB persistence
- Always implement a TTL or pruning strategy to prevent unbounded history growth

## Context Window Management
- Trim history before injection: \`trim_messages(messages, max_tokens=..., strategy="last")\`
- Summarize old turns with a summarization chain when history exceeds token budget
- Never pass raw message history without trimming to models with small context windows

## Session Isolation
- Use unique, non-guessable session IDs (UUID v4)
- Never share session history objects across requests — always fetch by ID
- Clear session history on explicit user logout or session expiry
`,
      },
      {
        path: 'langchain/agents-and-tools.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'LangChain agents, tools, and tool-calling patterns',
        content: `# LangChain Agents & Tools

## Tool Definition
- Decorate functions with \`@tool\` and provide a clear docstring — the docstring IS the tool description for the LLM
- Use Pydantic \`BaseModel\` as \`args_schema\` for structured tool inputs with validation
- Always declare \`return_direct=True\` for tools that should end the agent loop immediately
- Raise \`ToolException\` for recoverable errors — the agent will retry or handle gracefully

## Agent Executor
- Use \`create_tool_calling_agent\` + \`AgentExecutor\` (modern, model-agnostic)
- Set \`handle_parsing_errors=True\` on \`AgentExecutor\` to recover from malformed tool calls
- Set \`max_iterations\` to prevent infinite loops (default: 15 — lower for production)
- Set \`return_intermediate_steps=True\` for observability and debugging

## Tool Safety
- Validate and sanitize all tool inputs before executing external actions
- Tools that write data (DB writes, API calls) must be explicitly authorized — document side effects in docstring
- Use read-only tools by default; require explicit flag for write tools
- Never pass raw LLM output directly to shell commands or SQL queries

## Structured Output (tool-calling models)
- Prefer \`llm.with_structured_output(MyPydanticModel)\` over output parsers for schema enforcement
- Use \`include_raw=True\` to inspect raw model response alongside parsed output
- Bind tools to the LLM with \`llm.bind_tools([tool1, tool2])\` for tool-calling support
`,
      },
      {
        path: 'langchain/retrieval-and-rag.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'LangChain RAG, vector stores, and retrieval patterns',
        content: `# LangChain Retrieval & RAG

## Document Loading & Splitting
- Use \`RecursiveCharacterTextSplitter\` as the default splitter — respects semantic boundaries
- Set \`chunk_size\` and \`chunk_overlap\` based on embedding model token limits (e.g. 512/50 for most models)
- Always pass \`metadata\` (source, page, doc_id) when creating \`Document\` objects — needed for citation

## Embeddings
- Use \`langchain_google_genai.GoogleGenerativeAIEmbeddings\` for Gemini embeddings
- Cache embeddings with \`CacheBackedEmbeddings\` to avoid re-embedding unchanged documents
- Never embed the same document twice — check by hash before inserting into the vector store

## Vector Stores
- Use \`FAISS\` for local/development; use managed stores (Vertex AI Matching Engine, Pinecone) for production
- Always use \`as_retriever(search_type="mmr")\` for diverse results (Maximal Marginal Relevance)
- Set \`search_kwargs={"k": 4}\` — retrieve more than needed, then rerank
- Use metadata filters (\`filter\` param) to scope retrieval to relevant document subsets

## RAG Chain Patterns
- Standard pattern: \`retriever | format_docs | prompt | llm | StrOutputParser()\`
- Include source documents in the response for citation using \`RunnablePassthrough\`
- Use \`MultiQueryRetriever\` to generate query variations and improve recall
- Always evaluate retrieval quality (precision@k, recall) before deploying
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## LangChain-Specific Review
- Verify LCEL pipe operator (\`|\`) is used — flag any \`LLMChain\`, \`SequentialChain\`, or legacy chain imports
- Check that async methods (\`ainvoke\`, \`astream\`) are used for LLM calls in async contexts
- Verify \`ChatPromptTemplate.from_messages()\` uses typed message tuples, not raw strings
- Check output parsers have a schema — flag bare \`StrOutputParser\` where structured output is expected
- Verify \`RunnableWithMessageHistory\` is used for stateful conversations — not manual history appending
- Check \`AgentExecutor\` has \`max_iterations\` and \`handle_parsing_errors=True\`
- Verify tools have clear docstrings and Pydantic \`args_schema\` for structured inputs
- Check that tool inputs are validated before executing external actions
- Verify embeddings use \`CacheBackedEmbeddings\` to prevent redundant API calls
- Flag any raw LLM output passed directly to shell commands or SQL queries`,
      },
    ],
    skills: [
      {
        name: 'langchain-chain-builder',
        description: 'Build a LangChain LCEL chain with prompt, LLM, and output parser',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# LangChain Chain Builder

Build a complete LCEL chain following project conventions:

## Steps
1. Define \`ChatPromptTemplate.from_messages()\` with system + human roles
2. Select and configure the LLM (with temperature, model name from settings/env)
3. Choose output parser: \`StrOutputParser\`, \`JsonOutputParser\`, or \`PydanticOutputParser\`
4. Compose with LCEL: \`chain = prompt | llm | parser\`
5. Add async invoke: \`await chain.ainvoke({"input": ...})\`
6. If stateful: wrap with \`RunnableWithMessageHistory\`

## Checklist
- [ ] Imports from \`langchain_core\` (not \`langchain\`) where available
- [ ] Async methods used for I/O-bound calls
- [ ] Output parser has explicit schema
- [ ] Error handling for LLM API failures
- [ ] Unit test with mocked LLM using \`FakeListChatModel\`
`,
      },
    ],
  },
};
