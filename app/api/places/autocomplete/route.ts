// ==============================================
// src/app/api/places/autocomplete/route.ts - Google Places Autocomplete API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'

// ==============================================
// GET /api/places/autocomplete - Google Places Autocomplete
// ==============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    const types = searchParams.get('types') || 'geocode'
    const components = searchParams.get('components') || 'country:us'

    if (!input || input.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          message: 'Input must be at least 3 characters long.',
        },
        { status: 400 }
      )
    }

    // Get Google API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    console.log(apiKey, 'apiKey')

    if (!apiKey) {
      console.error('Google Places API key not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Service unavailable',
          message: 'Location service is currently unavailable.',
        },
        { status: 503 }
      )
    }

    try {
      // Call Google Places Autocomplete API
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(input)}&` +
        `types=${types}&` +
        `components=${components}&` +
        `key=${apiKey}`
      )

      const googleData = await googleResponse.json()

      if (!googleResponse.ok || googleData.status !== 'OK') {
        console.error('Google Places API error:', googleData)
        return NextResponse.json(
          {
            success: false,
            error: 'External service error',
            message: 'Unable to fetch location suggestions.',
          },
          { status: 502 }
        )
      }

      // Transform Google response to our format
      const suggestions = googleData.predictions.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: {
          main_text: prediction.structured_formatting?.main_text || '',
          secondary_text: prediction.structured_formatting?.secondary_text || '',
        },
        types: prediction.types,
      }))

      return NextResponse.json(
        {
          success: true,
          suggestions,
          message: 'Location suggestions retrieved successfully',
        },
        { status: 200 }
      )

    } catch (fetchError) {
      console.error('Error calling Google Places API:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'External service error',
          message: 'Unable to fetch location suggestions.',
        },
        { status: 502 }
      )
    }

  } catch (error) {
    console.error('Places autocomplete error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while fetching location suggestions.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}