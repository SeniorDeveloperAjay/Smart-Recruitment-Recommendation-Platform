const openai = require('./llmService')

const analyzeJobDescription = async (jobDescription) => {
  const response = await openai.chat.completions.create({
    model: 'openrouter/free',

    messages: [
      {
        role: 'system',
        content: `
You are an AI recruitment assistant.

Analyze the provided job description and extract structured recruitment requirements.

Return ONLY valid JSON in this exact structure:

{
  "skills": [],
  "minimumExperience": 0,
  "education": [],
  "responsibilities": [],
  "otherRequirements": []
}

Rules:
- skills must contain technical or professional skills mentioned in the job description.
- minimumExperience must be a number representing years. If not specified, use 0.
- education must contain educational qualifications mentioned.
- responsibilities must contain the major responsibilities.
- otherRequirements must contain important requirements that do not fit the other categories.
- Do not invent information that is not present in the job description.
`
      },
      {
        role: 'user',
        content: jobDescription
      }
    ]
  })

  const content = response.choices[0].message.content

  return content
}

module.exports = {
  analyzeJobDescription
}