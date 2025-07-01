// ==============================================
// src/app/api/places/details/route.ts - Google Places Details API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'

// ==============================================
// POST /api/places/details - Google Places Details
// ==============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { place_id } = body

    if (!place_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          message: 'Place ID is required.',
        },
        { status: 400 }
      )
    }

    // Get Google API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

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
      // Call Google Places Details API
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${encodeURIComponent(place_id)}&` +
        `fields=formatted_address,geometry,name,address_components&` +
        `key=${apiKey}`
      )

      const googleData = await googleResponse.json()

      if (!googleResponse.ok || googleData.status !== 'OK') {
        console.error('Google Places Details API error:', googleData)
        return NextResponse.json(
          {
            success: false,
            error: 'External service error',
            message: 'Unable to fetch location details.',
          },
          { status: 502 }
        )
      }

      const result = googleData.result

      // Transform Google response to our format
      const placeDetails = {
        place_id,
        name: result.name || '',
        formatted_address: result.formatted_address || '',
        geometry: {
          location: {
            lat: result.geometry?.location?.lat || 0,
            lng: result.geometry?.location?.lng || 0,
          },
        },
        address_components: result.address_components || [],
      }

      return NextResponse.json(
        {
          success: true,
          place: placeDetails,
          message: 'Location details retrieved successfully',
        },
        { status: 200 }
      )

    } catch (fetchError) {
      console.error('Error calling Google Places Details API:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'External service error',
          message: 'Unable to fetch location details.',
        },
        { status: 502 }
      )
    }

  } catch (error) {
    console.error('Places details error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while fetching location details.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
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