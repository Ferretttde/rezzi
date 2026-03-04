import Anthropic from 'npm:@anthropic-ai/sdk'

interface Ingredient {
  amount: string
  unit: string
  name: string
  group?: string
}

interface RecipeStep {
  order: number
  instruction: string
}

interface ImportedRecipe {
  title: string
  description?: string
  prep_time_mins?: number
  cook_time_mins?: number
  servings?: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('[import-recipe-image]', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json() as { imageBase64?: string; mediaType?: string }
    const { imageBase64, mediaType = 'image/jpeg' } = body

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const client = new Anthropic({ apiKey })

    const prompt = `Extrahiere das Rezept aus diesem Bild. Antworte ausschließlich mit validem JSON ohne Markdown-Codeblöcke:
{
  "title": "Rezepttitel",
  "description": "Kurze Beschreibung oder null",
  "prep_time_mins": null,
  "cook_time_mins": null,
  "servings": null,
  "ingredients": [{"amount": "200", "unit": "g", "name": "Mehl", "group": ""}],
  "steps": [{"order": 1, "instruction": "Schritt beschreibung"}]
}

Wichtig:
- title: Pflichtfeld, als String
- description: String oder null
- prep_time_mins / cook_time_mins / servings: Zahl oder null
- ingredients: Array mit amount (String), unit (String), name (String), group (String, leer wenn keine Gruppe)
- steps: Array mit order (Zahl ab 1) und instruction (String)
- Antworte NUR mit dem JSON-Objekt, kein weiterer Text`

    console.log('[import-recipe-image] calling Claude Vision...')

    const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
    type ValidMediaType = typeof validMediaTypes[number]
    const safeMediaType: ValidMediaType = validMediaTypes.includes(mediaType as ValidMediaType)
      ? (mediaType as ValidMediaType)
      : 'image/jpeg'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: safeMediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : ''
    console.log('[import-recipe-image] raw response:', responseText.slice(0, 200))

    let recipe: ImportedRecipe
    try {
      // Strip potential markdown code fences
      const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      recipe = JSON.parse(cleaned) as ImportedRecipe
    } catch {
      return new Response(
        JSON.stringify({ error: 'Claude hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure required fields
    if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return new Response(
        JSON.stringify({ error: 'Unvollständige Rezeptdaten extrahiert. Bitte manuell eingeben.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(recipe),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[import-recipe-image] unhandled error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
