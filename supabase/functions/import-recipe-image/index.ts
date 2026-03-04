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
      console.error('[import-recipe-image] ANTHROPIC_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const safeMediaType = validMediaTypes.includes(mediaType) ? mediaType : 'image/jpeg'

    const prompt = `Extrahiere das Rezept aus diesem Bild. Antworte ausschließlich mit validem JSON ohne Markdown-Codeblöcke:
{
  "title": "Rezepttitel",
  "description": "Kurze Beschreibung oder null",
  "prep_time_mins": null,
  "cook_time_mins": null,
  "servings": null,
  "ingredients": [{"amount": "200", "unit": "g", "name": "Mehl", "group": ""}],
  "steps": [{"order": 1, "instruction": "Schritt"}]
}

Regeln:
- title: Pflichtfeld als String
- description: String oder null
- prep_time_mins / cook_time_mins / servings: Zahl oder null
- ingredients: amount, unit, name, group als Strings (group leer wenn keine Gruppe)
- steps: order ab 1, instruction als String
- NUR das JSON-Objekt, kein weiterer Text`

    console.log('[import-recipe-image] calling Anthropic API...')

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[import-recipe-image] Anthropic API error:', anthropicRes.status, errText)
      return new Response(
        JSON.stringify({ error: `Anthropic API Fehler: ${anthropicRes.status} – ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicData = await anthropicRes.json() as {
      content: Array<{ type: string; text: string }>
    }

    const responseText = anthropicData.content?.[0]?.text ?? ''
    console.log('[import-recipe-image] response preview:', responseText.slice(0, 300))

    let recipe: ImportedRecipe
    try {
      const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      recipe = JSON.parse(cleaned) as ImportedRecipe
    } catch {
      console.error('[import-recipe-image] JSON parse failed:', responseText.slice(0, 300))
      return new Response(
        JSON.stringify({ error: 'Claude hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
