const crypto = require('crypto')

const {
  analyzeCandidateForJob
} = require('./candidateMatchingService')

const {
  analyzeCandidateProfile
} = require('./candidateAnalyzerService')

// Maximum number of completed AI analyses to keep in memory.
const MAX_AI_CACHE_ENTRIES = 100

// Stores completed AI analyses in memory.
const aiAnalysisCache = new Map()

// Stores AI requests that are currently in progress.
const inFlightAnalysisCache = new Map()

// Add a result to the cache and remove the oldest entry if necessary.
const cacheSuccessfulAnalysis = (cacheKey, result) => {
  // Refresh the entry's position if the key already exists.
  if (aiAnalysisCache.has(cacheKey)) {
    aiAnalysisCache.delete(cacheKey)
  }

  // Remove the oldest cached entry when the cache is full.
  if (aiAnalysisCache.size >= MAX_AI_CACHE_ENTRIES) {
    const oldestCacheKey = aiAnalysisCache.keys().next().value

    if (oldestCacheKey !== undefined) {
      aiAnalysisCache.delete(oldestCacheKey)

      console.log(
        'Removed the oldest AI analysis from the cache'
      )
    }
  }

  aiAnalysisCache.set(cacheKey, result)
}

class MaxHeap {
  constructor() {
    this.heap = []
  }

  insert(item) {
    this.heap.push(item)
    this.bubbleUp()
  }

  removeMax() {
    if (this.heap.length === 0) {
      return null
    }

    if (this.heap.length === 1) {
      return this.heap.pop()
    }

    const max = this.heap[0]
    this.heap[0] = this.heap.pop()

    this.bubbleDown()

    return max
  }

  bubbleUp() {
    let index = this.heap.length - 1

    while (index > 0) {
      const parentIndex = Math.floor(
        (index - 1) / 2
      )

      if (
        this.heap[parentIndex].priority >=
        this.heap[index].priority
      ) {
        break
      }

      ;[
        this.heap[parentIndex],
        this.heap[index]
      ] = [
        this.heap[index],
        this.heap[parentIndex]
      ]

      index = parentIndex
    }
  }

  bubbleDown() {
    let index = 0

    while (true) {
      const leftIndex = index * 2 + 1
      const rightIndex = index * 2 + 2

      let largestIndex = index

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex].priority >
          this.heap[largestIndex].priority
      ) {
        largestIndex = leftIndex
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex].priority >
          this.heap[largestIndex].priority
      ) {
        largestIndex = rightIndex
      }

      if (largestIndex === index) {
        break
      }

      ;[
        this.heap[index],
        this.heap[largestIndex]
      ] = [
        this.heap[largestIndex],
        this.heap[index]
      ]

      index = largestIndex
    }
  }

  isEmpty() {
    return this.heap.length === 0
  }
}

const buildCandidateText = (candidate) => {
  const sections = [
    candidate.fullName
      ? `Name: ${candidate.fullName}`
      : '',

    candidate.skills?.length
      ? `Skills: ${candidate.skills.join(', ')}`
      : '',

    candidate.education
      ? `Education: ${candidate.education}`
      : '',

    Number.isFinite(Number(candidate.experience))
      ? `Saved experience: ${candidate.experience} years`
      : '',

    candidate.location
      ? `Location: ${candidate.location}`
      : '',

    candidate.resumeText?.trim()
      ? `Resume text:\n${candidate.resumeText.trim()}`
      : ''
  ]

  return sections
    .filter(Boolean)
    .join('\n')
}

const createCacheKey = (candidateText) => {
  return crypto
    .createHash('sha256')
    .update(candidateText)
    .digest('hex')
}

const analyzeCandidateWithAI = async (candidate) => {
  const candidateText = buildCandidateText(candidate)

  if (!candidateText.trim()) {
    return {
      status: 'skipped',
      message: 'No candidate information was available for analysis',
      analysis: null
    }
  }

  const cacheKey = createCacheKey(candidateText)

  // 1. Reuse an already completed analysis.
  if (aiAnalysisCache.has(cacheKey)) {
    const cachedResult = aiAnalysisCache.get(cacheKey)

    // Move the reused entry to the newest position.
    aiAnalysisCache.delete(cacheKey)
    aiAnalysisCache.set(cacheKey, cachedResult)

    console.log(
      `Using cached AI analysis for candidate ${candidate._id}`
    )

    return {
      ...cachedResult,
      message: 'Reused previous AI analysis'
    }
  }

  // 2. Reuse an AI request that is still in progress.
  if (inFlightAnalysisCache.has(cacheKey)) {
    console.log(
      `Reusing in-progress AI request for candidate ${candidate._id}`
    )

    const result = await inFlightAnalysisCache.get(cacheKey)

    return {
      ...result,
      message:
        result.status === 'completed'
          ? 'Reused shared AI analysis request'
          : result.message
    }
  }

  // 3. Start a new request and register its promise immediately.
  const analysisPromise = (async () => {
    try {
      console.log(
        `Requesting AI analysis for candidate ${candidate._id}`
      )

      const rawAnalysis = await analyzeCandidateProfile(
        candidateText
      )

      const parsedAnalysis =
        typeof rawAnalysis === 'string'
          ? JSON.parse(rawAnalysis)
          : rawAnalysis

      const isValid =
        parsedAnalysis &&
        typeof parsedAnalysis === 'object' &&
        !Array.isArray(parsedAnalysis) &&
        Array.isArray(parsedAnalysis.skills) &&
        Array.isArray(parsedAnalysis.education) &&
        Array.isArray(parsedAnalysis.certifications) &&
        Array.isArray(parsedAnalysis.projects) &&
        Array.isArray(parsedAnalysis.otherInformation) &&
        typeof parsedAnalysis.experience === 'number' &&
        Number.isFinite(parsedAnalysis.experience) &&
        parsedAnalysis.experience >= 0 &&
        typeof parsedAnalysis.location === 'string' &&
        typeof parsedAnalysis.summary === 'string'

      if (!isValid) {
        const fieldTypes =
          parsedAnalysis &&
          typeof parsedAnalysis === 'object'
            ? Object.fromEntries(
                Object.entries(parsedAnalysis).map(
                  ([key, value]) => [
                    key,
                    Array.isArray(value)
                      ? 'array'
                      : typeof value
                  ]
                )
              )
            : typeof parsedAnalysis

        console.error(
          'Invalid AI candidate analysis structure:',
          JSON.stringify(fieldTypes)
        )

        throw new Error(
          'AI returned an invalid candidate analysis'
        )
      }

      const result = {
        status: 'completed',
        message:
          'AI analysis completed. Verify extracted information.',
        analysis: parsedAnalysis
      }

      // Cache only successful results.
      cacheSuccessfulAnalysis(cacheKey, result)

      console.log(
        `AI analysis completed and cached for candidate ${candidate._id}`
      )

      return result
    } catch (error) {
      console.error(
        `AI analysis failed for candidate ${candidate._id}:`,
        error.message
      )

      return {
        status: 'failed',
        message: 'AI analysis is temporarily unavailable',
        analysis: null
      }
    }
  })()

  inFlightAnalysisCache.set(cacheKey, analysisPromise)

  try {
    return await analysisPromise
  } finally {
    // Remove the in-progress entry whether the request succeeds or fails.
    inFlightAnalysisCache.delete(cacheKey)
  }
}

const rankCandidatesWithBestFirstSearch = async (
  job,
  candidates
) => {
  const priorityQueue = new MaxHeap()

  const candidateResults = await Promise.all(
    candidates.map(async (candidate) => {
      const matchingAnalysis = analyzeCandidateForJob(
        job,
        candidate
      )

      const aiAnalysis = candidate.resumeText?.trim()
        ? await analyzeCandidateWithAI(candidate)
        : {
            status: 'skipped',
            message: 'No resume text available for AI analysis',
            analysis: null
          }

      return {
        // Preserve the original MongoDB candidate identity.
        candidateId: String(candidate._id),
        candidateName: candidate.fullName || 'Unknown candidate',
        matchingAnalysis,
        aiAnalysis
      }
    })
  )

  // Insert candidates into the max-heap using their matching scores.
  for (const result of candidateResults) {
    priorityQueue.insert({
      analysis: {
        ...result.matchingAnalysis,

        // Explicitly attach candidate identity to ranking results.
        candidateId: result.candidateId,
        candidateName: result.candidateName,

        aiAnalysis: result.aiAnalysis
      },

      priority: result.matchingAnalysis.score.totalScore
    })
  }

  // Extract candidates from highest to lowest priority.
  const rankedCandidates = []

  while (!priorityQueue.isEmpty()) {
    const currentNode = priorityQueue.removeMax()
    rankedCandidates.push(currentNode.analysis)
  }

  return rankedCandidates
}

module.exports = {
  rankCandidatesWithBestFirstSearch
}