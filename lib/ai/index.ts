// ==============================================
// lib/ai/index.ts - AI Utilities Exports
// ==============================================

export {
  createChatCompletion,
  createStreamingChatCompletion,
  estimateTokens,
  validateOpenAIConfig,
  openai,
  AI_CONFIG,
} from './openai-client'

export {
  BASE_CONSTRUCTION_PROMPT,
  getRoleBasedPrompt,
  buildSystemPrompt,
  generateCompleteSystemPrompt,
  PRIVACY_ENFORCEMENT,
  EXAMPLES_PROMPT,
} from './prompts/construction'

export {
  getAIContextPermissions,
  canAccessData,
  getAccessDenialMessage,
} from './permissions'