export async function generateResponseWithProvider(prompt, context = {}) {
  // Provider abstraction: for now we have no external LLM configured.
  // This function returns null to indicate no provider is available.
  // Later, implement backend call to an LLM service.
  return null;
}
