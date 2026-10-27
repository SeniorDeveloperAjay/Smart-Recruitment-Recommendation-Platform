const openai = require('./llmService')

const MAX_ATTEMPTS = 2

const analyzeCandidateProfile = async (candidateText) => {
  if (
    typeof candidateText !== 'string' ||
    !candidateText.trim()
  ) {
    throw new Error(
      'Candidate profile or resume text is required'
    )
  }

  let lastError

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      if (attempt > 1) {
        console.log(
          `Retrying AI candidate analysis (attempt ${attempt}/${MAX_ATTEMPTS})`
        )
      }

      const response = await openai.chat.completions.create(
        {
          model: 'openrouter/free',

          messages: [
            {
              role: 'system',
              content: `
You are an AI recruitment assistant.

Analyze the provided candidate profile or resume text.

Return ONLY a valid JSON object using this exact structure:

{
  "skills": [],
  "experience": 0,
  "education": [],
  "certifications": [],
  "projects": [],
  "location": "",
  "summary": "",
  "otherInformation": []
}

Rules:
- Extract only information explicitly supported by the supplied text.
- Do not invent skills, experience, qualifications, certifications, projects, or location.
- Experience must be a non-negative number representing explicitly stated years of experience.
- Use 0 when the duration of experience is not specified.
- Use empty arrays when information for an array field is unavailable.
- Use an empty string when location or summary information is unavailable.
- Do not make hiring decisions.
- Do not include Markdown formatting or text outside the JSON object.
`
            },
            {
              role: 'user',
              content: candidateText.trim()
            }
          ],

          response_format: {
            type: 'json_object'
          }
        },
        {
          timeout: 30000
        }
      )

      const content =
        response.choices?.[0]?.message?.content

      if (
        typeof content !== 'string' ||
        !content.trim()
      ) {
        throw new Error(
          'AI provider returned an empty candidate analysis'
        )
      }

      // Validate that the response is JSON.
      let parsedAnalysis

      try {
        parsedAnalysis = JSON.parse(content)
      } catch {
        console.error(
          'AI provider returned a non-JSON response:',
          content.slice(0, 200)
        )

        throw new Error(
          'AI provider returned an invalid JSON response'
        )
      }

      // Validate the required structure.
      const validStructure =
        parsedAnalysis &&
        typeof parsedAnalysis === 'object' &&
        !Array.isArray(parsedAnalysis) &&
        Array.isArray(parsedAnalysis.skills) &&
        typeof parsedAnalysis.experience === 'number' &&
        Number.isFinite(parsedAnalysis.experience) &&
        parsedAnalysis.experience >= 0 &&
        Array.isArray(parsedAnalysis.education) &&
        Array.isArray(parsedAnalysis.certifications) &&
        Array.isArray(parsedAnalysis.projects) &&
        typeof parsedAnalysis.location === 'string' &&
        typeof parsedAnalysis.summary === 'string' &&
        Array.isArray(parsedAnalysis.otherInformation)

      if (!validStructure) {
        throw new Error(
          'AI provider returned an invalid candidate analysis structure'
        )
      }

      // Return the validated result immediately.
      return JSON.stringify(parsedAnalysis)
    } catch (error) {
      lastError = error

      console.error(
        `AI analysis attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
        error.message
      )

      // Retry once, then stop if the next attempt also fails.
      if (attempt === MAX_ATTEMPTS) {
        break
      }
    }
  }

  throw lastError || new Error(
    'AI candidate analysis failed'
  )
}

module.exports = {
  analyzeCandidateProfile
}