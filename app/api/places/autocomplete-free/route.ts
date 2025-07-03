// ==============================================
// src/app/api/places/autocomplete-free/route.ts - Free Nominatim Autocomplete API
// ==============================================

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

    try {
      // Call Nominatim API (free OpenStreetMap service)
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(input)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `countrycodes=${countrycode}&` +
        `limit=8&` +
        `dedupe=1`,
        {
          headers: {
            'User-Agent': 'ProjectManagementApp/1.0 (Contact: your-email@example.com)' // Nominatim requires a User-Agent
          }
        }
      )

      const nominatimData = await nominatimResponse.json()

      if (!nominatimResponse.ok) {
        throw new Error('Nominatim API error')
      }

      // Transform Nominatim response to match Google Places format
      const suggestions = nominatimData.map((place: any) => {
        // Create a more readable main text
        let mainText = ''
        let secondaryText = ''

        if (place.address) {
          // Build main text from address components
          const addressParts = []
          if (place.address.house_number) addressParts.push(place.address.house_number)
          if (place.address.road) addressParts.push(place.address.road)
          
          mainText = addressParts.length > 0 
            ? addressParts.join(' ')
            : place.name || place.display_name.split(',')[0]

          // Build secondary text
          const secondaryParts = []
          if (place.address.city || place.address.town || place.address.village) {
            secondaryParts.push(place.address.city || place.address.town || place.address.village)
          }
          if (place.address.state) secondaryParts.push(place.address.state)
          if (place.address.postcode) secondaryParts.push(place.address.postcode)
          
          secondaryText = secondaryParts.join(', ')
        } else {
          const parts = place.display_name.split(',')
          mainText = parts[0] || place.name || 'Unknown location'
          secondaryText = parts.slice(1).join(',').trim()
        }

        return {
          place_id: `nominatim_${place.place_id}`,
          description: place.display_name,
          structured_formatting: {
            main_text: mainText,
            secondary_text: secondaryText,
          },
          types: ['geocode'],
          coordinates: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          },
          address_components: place.address || {}
        }
      })

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