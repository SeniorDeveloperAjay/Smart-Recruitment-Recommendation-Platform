const openai = require('./llmService')

const extractJSON = (content) => {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('AI returned an empty recommendation response')
  }

  // Remove common Markdown code fences.
  const cleanedContent = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  // First, try parsing the complete response.
  try {
    return JSON.parse(cleanedContent)
  } catch {
    // Continue to attempt extraction of a JSON object.
  }

  // Extract the outermost JSON object when extra text is present.
  const startIndex = cleanedContent.indexOf('{')
  const endIndex = cleanedContent.lastIndexOf('}')

  if (startIndex === -1 || endIndex <= startIndex) {
    throw new Error('AI response did not contain a valid JSON object')
  }

  const jsonContent = cleanedContent.slice(
    startIndex,
    endIndex + 1
  )

  try {
    return JSON.parse(jsonContent)
  } catch {
    throw new Error('AI returned invalid recommendation JSON')
  }
}

const validateRecommendations = (result) => {
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    typeof result.summary !== 'string' ||
    !Array.isArray(result.recommendations) ||
    !Array.isArray(result.interviewQuestions)
  ) {
    throw new Error(
      'AI returned an invalid recommendation structure'
    )
  }

  const validRecommendations = result.recommendations.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof item.candidateId === 'string' &&
      ['High', 'Medium', 'Low'].includes(item.priority) &&
      typeof item.reason === 'string' &&
      Array.isArray(item.skillsToVerify) &&
      Array.isArray(item.informationToClarify)
  )

  if (!validRecommendations) {
    throw new Error(
      'AI returned invalid candidate recommendation fields'
    )
  }

  const validQuestions = result.interviewQuestions.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof item.question === 'string' &&
      typeof item.skillAssessed === 'string' &&
      typeof item.purpose === 'string'
  )

  if (!validQuestions) {
    throw new Error(
      'AI returned invalid interview question fields'
    )
  }

  return result
}

const generateRecruitmentRecommendations = async ({
  job,
  candidates
}) => {
  if (!job || !job.title) {
    throw new Error('Valid job information is required')
  }

  if (!Array.isArray(candidates)) {
    throw new Error('Candidates must be provided as an array')
  }

  if (candidates.length === 0) {
    return {
      summary: 'No candidates are available for this job.',
      recommendations: [],
      interviewQuestions: []
    }
  }

  const candidateInformation = candidates.map(
    (candidate, index) => ({
      candidateNumber: index + 1,
      candidateId: String(candidate.id || ''),
      name: candidate.name || 'Unknown candidate',
      eligible: candidate.eligible === true,
      matchScore: Number(candidate.matchScore) || 0,
      matchedSkills: Array.isArray(candidate.matchedSkills)
        ? candidate.matchedSkills
        : [],
      missingSkills: Array.isArray(candidate.missingSkills)
        ? candidate.missingSkills
        : [],
      experience: candidate.experience ?? 0,
      resumeSummary: candidate.resumeSummary || ''
    })
  )

  let response

  try {
    response = await openai.chat.completions.create(
      {
        model: 'openrouter/free',

        messages: [
          {
            role: 'system',
            content: `
You are an AI recruitment assistant.

Generate practical recommendations to help a recruiter
review candidates for a specific job.

Rules:
- Use only the supplied job and candidate information.
- Recommend only candidates whose supplied eligible field is true.
- Use candidate IDs exactly as supplied.
- Prioritize eligible candidates using their supplied match scores.
- Do not invent qualifications, skills, or experience.
- Identify job-related skills that should be verified.
- Suggest useful, job-related interview questions.
- Do not make final hiring decisions.
- Treat match scores and eligibility as fixed inputs.
- Return only one complete JSON object.
- Do not include Markdown, code fences, or explanatory text.
- Follow this exact structure:

{
  "summary": "Brief recruitment overview",
  "recommendations": [
    {
      "candidateId": "candidate ID",
      "priority": "High",
      "reason": "Explanation based on supplied information",
      "skillsToVerify": ["Relevant skill"],
      "informationToClarify": ["Relevant information"]
    }
  ],
  "interviewQuestions": [
    {
      "question": "Interview question",
      "skillAssessed": "Relevant skill",
      "purpose": "What the question assesses"
    }
  ]
}

Use an empty array when no suitable items are available.
`
          },
          {
            role: 'user',
            content: JSON.stringify({
              job: {
                title: job.title,
                description: job.description || '',
                requiredSkills: Array.isArray(job.requiredSkills)
                  ? job.requiredSkills
                  : [],
                minimumExperience: job.minimumExperience ?? 0
              },
              candidates: candidateInformation
            })
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
  } catch (error) {
    console.error(
      'AI recommendation request failed:',
      error.message
    )

    throw new Error(
      'Unable to generate AI recruitment recommendations. Please try again.'
    )
  }

  const content = response.choices?.[0]?.message?.content

  let result

  try {
    result = extractJSON(content)
    return validateRecommendations(result)
  } catch (error) {
    console.error(
      'AI recommendation response validation failed:',
      error.message
    )

    throw error
  }
}

module.exports = {
  generateRecruitmentRecommendations
}