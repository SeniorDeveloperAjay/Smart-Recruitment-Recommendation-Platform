const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
}

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return []
  }

  return skills.map((skill) => normalizeText(skill))
}

const checkCSPEligibility = (job, candidate) => {
  const requiredSkills = normalizeSkills(job.requiredSkills)
  const candidateSkills = normalizeSkills(candidate.skills)

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.includes(skill)
  )

  const missingSkills = requiredSkills.filter(
    (skill) => !candidateSkills.includes(skill)
  )

  const candidateExperience = Number(candidate.experience) || 0
  const minimumExperience = Number(job.minimumExperience) || 0

  const experienceSatisfied =
    candidateExperience >= minimumExperience

  const skillsSatisfied =
    missingSkills.length === 0

  const eligible =
    experienceSatisfied && skillsSatisfied

  return {
    eligible,
    experienceSatisfied,
    skillsSatisfied,
    matchedSkills,
    missingSkills
  }
}

const calculateMatchScore = (job, candidate, cspResult) => {
  const requiredSkillCount = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.length
    : 0

  const skillMatchPercentage =
    requiredSkillCount === 0
      ? 100
      : (cspResult.matchedSkills.length / requiredSkillCount) * 100

  const candidateExperience = Number(candidate.experience) || 0
  const minimumExperience = Number(job.minimumExperience) || 0

  const experienceRatio =
    minimumExperience === 0
      ? 1
      : candidateExperience / minimumExperience

  const experienceScore = Math.min(
    experienceRatio * 100,
    100
  )

  const totalScore =
    skillMatchPercentage * 0.7 +
    experienceScore * 0.3

  return {
    skillMatchPercentage: Number(
      skillMatchPercentage.toFixed(2)
    ),
    experienceScore: Number(
      experienceScore.toFixed(2)
    ),
    totalScore: Number(
      totalScore.toFixed(2)
    )
  }
}

const generateExplanation = (
  job,
  candidate,
  cspResult,
  score
) => {
  const reasons = []

  const candidateExperience = Number(candidate.experience) || 0
  const minimumExperience = Number(job.minimumExperience) || 0

  if (cspResult.experienceSatisfied) {
    reasons.push(
      `Candidate has ${candidateExperience} years of experience against the required ${minimumExperience} years.`
    )
  } else {
    reasons.push(
      `Candidate has ${candidateExperience} years of experience, below the required ${minimumExperience} years.`
    )
  }

  if (cspResult.matchedSkills.length > 0) {
    reasons.push(
      `Matched skills: ${cspResult.matchedSkills.join(', ')}.`
    )
  }

  if (cspResult.missingSkills.length > 0) {
    reasons.push(
      `Missing skills: ${cspResult.missingSkills.join(', ')}.`
    )
  } else {
    reasons.push(
      'All required skills are present in the saved candidate profile.'
    )
  }

  if (cspResult.eligible) {
    reasons.push(
      'Candidate satisfies all current mandatory eligibility constraints.'
    )
  } else {
    reasons.push(
      'Candidate does not satisfy all current mandatory eligibility constraints.'
    )
  }

  return {
    summary: cspResult.eligible
      ? `Candidate is eligible with a match score of ${score.totalScore}%.`
      : `Candidate is not eligible under the current mandatory constraints. The calculated match score is ${score.totalScore}%.`,

    reasons,

    breakdown: {
      skills: {
        required: Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : [],
        matched: cspResult.matchedSkills,
        missing: cspResult.missingSkills,
        allRequiredSkillsMatched: cspResult.skillsSatisfied
      },

      experience: {
        candidateYears: candidateExperience,
        minimumRequiredYears: minimumExperience,
        requirementSatisfied: cspResult.experienceSatisfied
      },

      eligibility: {
        eligible: cspResult.eligible,
        skillsSatisfied: cspResult.skillsSatisfied,
        experienceSatisfied: cspResult.experienceSatisfied
      },

      score: {
        skillsPercentage: score.skillMatchPercentage,
        experiencePercentage: score.experienceScore,
        totalPercentage: score.totalScore
      }
    }
  }
}

const analyzeCandidateForJob = (job, candidate) => {
  const cspResult = checkCSPEligibility(
    job,
    candidate
  )

  const score = calculateMatchScore(
    job,
    candidate,
    cspResult
  )

  const explanation = generateExplanation(
    job,
    candidate,
    cspResult,
    score
  )

  return {
    candidateId: candidate._id,
    candidateName: candidate.fullName,

    eligibility: {
      eligible: cspResult.eligible,
      experienceSatisfied:
        cspResult.experienceSatisfied,
      skillsSatisfied:
        cspResult.skillsSatisfied
    },

    matchedSkills: cspResult.matchedSkills,
    missingSkills: cspResult.missingSkills,

    score,

    explanation,

    algorithm: {
      eligibility: 'Constraint Satisfaction Problem',
      ranking: 'Best-First Search'
    }
  }
}

module.exports = {
  analyzeCandidateForJob,
  checkCSPEligibility,
  calculateMatchScore
}