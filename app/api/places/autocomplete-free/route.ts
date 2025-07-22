// Alternative API route using OpenStreetMap Nominatim (completely free)
// Create: /api/places/autocomplete-free/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    const countrycode = searchParams.get('countrycode') || 'us'

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

    console.log(input, 'input')

    try {
      // Call Nominatim API (free OpenStreetMap service)
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(input)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `countrycodes=${countrycode}&` +
        `limit=5`,
        {
          headers: {
            'User-Agent': 'CrewBud AI/1.0 (hmujahid@aipunchpro.com)', // Required by OSM policy
            'Accept': 'application/json'
          }
        }
      )

      const nominatimData = await nominatimResponse.json()

      if (!nominatimResponse.ok) {
        throw new Error('Nominatim API error')
      }

      // Transform Nominatim response to match Google Places format
      const suggestions = nominatimData.map((place: any) => ({
        place_id: place.place_id,
        description: place.display_name,
        structured_formatting: {
          main_text: place.address?.house_number && place.address?.road
            ? `${place.address.house_number} ${place.address.road}`
            : place.address?.road || place.name || place.display_name.split(',')[0],
          secondary_text: place.display_name.split(',').slice(1).join(',').trim(),
        },
        types: ['geocode'],
        coordinates: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        }
      }))

      return NextResponse.json(
        {
          success: true,
          suggestions,
          message: 'Location suggestions retrieved successfully',
          provider: 'OpenStreetMap'
        },
        { status: 200 }
      )

    } catch (fetchError) {
      console.error('Error calling Nominatim API:', fetchError)
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