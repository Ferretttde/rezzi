// Deno-compatible recipe extraction using Schema.org JSON-LD parsing
// We do not use @extractus/recipe-extractor directly in Deno edge functions;
// instead we parse Schema.org Recipe markup from the HTML.

interface Ingredient {
  amount: string
  unit: string
  name: string
  group?: string
}

interface RecipeStep {
  order: number
  instruction: string
  image_url?: string
}

interface ImportedRecipe {
  title: string
  description?: string
  image_url?: string
  source_url?: string
  prep_time_mins?: number
  cook_time_mins?: number
  servings?: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
}

// Parse ISO 8601 duration to minutes (e.g. PT1H30M → 90)
function parseDuration(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return undefined
  const hours = parseInt(match[1] ?? '0')
  const mins = parseInt(match[2] ?? '0')
  return hours * 60 + mins || undefined
}

// Parse ingredient string into structured format
function parseIngredient(raw: string): Ingredient {
  const cleaned = raw.trim()
  // Try to extract a leading number/fraction
  const amountMatch = cleaned.match(/^([\d\s/½⅓¼¾⅔⅛]+)\s*/)
  const amount = amountMatch ? amountMatch[1].trim() : ''
  const rest = amountMatch ? cleaned.slice(amountMatch[0].length) : cleaned

  // Common units
  const units = ['cups?', 'tbsp', 'tablespoons?', 'tsp', 'teaspoons?', 'oz', 'ounces?',
    'lbs?', 'pounds?', 'g', 'grams?', 'kg', 'ml', 'liters?', 'l', 'cloves?',
    'slices?', 'pieces?', 'cans?', 'packages?', 'pinch(?:es)?', 'handful']
  const unitPattern = new RegExp(`^(${units.join('|')})\\s+`, 'i')
  const unitMatch = rest.match(unitPattern)
  const unit = unitMatch ? unitMatch[1] : ''
  const name = unitMatch ? rest.slice(unitMatch[0].length) : rest

  return { amount, unit, name: name || cleaned }
}

// Extract recipe from page HTML using Schema.org JSON-LD
function extractFromJsonLd(html: string, sourceUrl: string): ImportedRecipe | null {
  // Find all JSON-LD script tags
  const scriptMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(match[1] ?? '{}') as Record<string, unknown>

      // Handle @graph arrays
      const candidates: Record<string, unknown>[] = []
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        candidates.push(...(parsed['@graph'] as Record<string, unknown>[]))
      } else {
        candidates.push(parsed)
      }

      for (const item of candidates) {
        const type = item['@type']
        const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
        if (!isRecipe) continue

        // Extract image
        let imageUrl: string | undefined
        const img = item['image']
        if (typeof img === 'string') imageUrl = img
        else if (Array.isArray(img) && img.length > 0) imageUrl = typeof img[0] === 'string' ? img[0] : (img[0] as Record<string, unknown>)['url'] as string
        else if (img && typeof img === 'object') imageUrl = (img as Record<string, unknown>)['url'] as string

        // Extract ingredients
        const rawIngredients = item['recipeIngredient']
        const ingredients: Ingredient[] = Array.isArray(rawIngredients)
          ? (rawIngredients as string[]).map(parseIngredient)
          : []

        // Extract steps
        const rawInstructions = item['recipeInstructions']
        const steps: RecipeStep[] = []
        if (Array.isArray(rawInstructions)) {
          rawInstructions.forEach((step, i) => {
            if (typeof step === 'string') {
              steps.push({ order: i + 1, instruction: step.trim() })
            } else if (step && typeof step === 'object') {
              const s = step as Record<string, unknown>
              const instruction = (s['text'] ?? s['name'] ?? '') as string
              if (instruction.trim()) {
                steps.push({ order: i + 1, instruction: instruction.trim() })
              }
            }
          })
        } else if (typeof rawInstructions === 'string') {
          steps.push({ order: 1, instruction: rawInstructions.trim() })
        }

        // Extract servings
        const yieldVal = item['recipeYield']
        let servings: number | undefined
        if (typeof yieldVal === 'number') servings = yieldVal
        else if (typeof yieldVal === 'string') {
          const num = parseInt(yieldVal)
          if (!isNaN(num)) servings = num
        } else if (Array.isArray(yieldVal) && yieldVal.length > 0) {
          const num = parseInt(String(yieldVal[0]))
          if (!isNaN(num)) servings = num
        }

        return {
          title: (item['name'] as string) ?? 'Imported Recipe',
          description: (item['description'] as string) ?? undefined,
          image_url: imageUrl,
          source_url: sourceUrl,
          prep_time_mins: parseDuration(item['prepTime'] as string),
          cook_time_mins: parseDuration(item['cookTime'] as string),
          servings,
          ingredients,
          steps,
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  }

  return null
}

// Fallback: extract from microdata or meta tags
function extractFallback(html: string, sourceUrl: string): ImportedRecipe | null {
  // Try to get title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].replace(/\s*[|\-–—].*$/, '').trim() : 'Imported Recipe'

  // Try og:image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  const imageUrl = ogImageMatch ? ogImageMatch[1] : undefined

  // Try og:description
  const ogDescMatch = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i)
  const description = ogDescMatch ? ogDescMatch[1] : undefined

  if (!title || title === 'Imported Recipe') return null

  return {
    title,
    description,
    image_url: imageUrl,
    source_url: sourceUrl,
    ingredients: [],
    steps: [],
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('[import-recipe]', req.method, req.url)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json() as { url?: string }
    const { url } = body
    console.log('[import-recipe] requested URL:', url)

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only allow http(s) URLs
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: 'Only HTTP/HTTPS URLs are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[import-recipe] fetching page...')
    // Fetch the page with realistic browser headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    })

    console.log('[import-recipe] fetch status:', response.status, response.headers.get('content-type'))
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return new Response(
        JSON.stringify({ error: 'URL does not return an HTML page' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()

    // Try JSON-LD first, then fallback
    const recipe = extractFromJsonLd(html, url) ?? extractFallback(html, url)

    if (!recipe) {
      return new Response(
        JSON.stringify({
          error: 'Could not extract recipe data from this page. The site may not use standard Recipe markup.',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(recipe),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[import-recipe] unhandled error:', message, err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
