import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the file from the request
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔄 Converting HEIC file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Use heic.online service
    const heicOnlineFormData = new FormData()
    heicOnlineFormData.append('file', file)
    heicOnlineFormData.append('format', 'jpeg')
    heicOnlineFormData.append('quality', '85')
    heicOnlineFormData.append('remove_exif', 'true')

    // Send to heic.online
    const heicOnlineResponse = await fetch('https://heic.online/api/convert', {
      method: 'POST',
      body: heicOnlineFormData,
    })

    if (!heicOnlineResponse.ok) {
      throw new Error(`heic.online API error: ${heicOnlineResponse.status}`)
    }

    // Get the converted file
    const convertedBlob = await heicOnlineResponse.blob()
    const convertedFile = new File(
      [convertedBlob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    )

    console.log(`✅ Conversion successful: ${convertedFile.name} (${(convertedFile.size / 1024 / 1024).toFixed(2)}MB)`)

    // Return the converted file
    return new Response(convertedFile, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${convertedFile.name}"`,
      },
    })

  } catch (error) {
    console.error('❌ Conversion failed:', error)

    return new Response(
      JSON.stringify({
        error: 'Conversion failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
