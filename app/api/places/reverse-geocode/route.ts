// ==============================================
// app/api/places/reverse-geocode/route.ts - Reverse Geocoding API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'

// ==============================================
// POST /api/places/reverse-geocode - Reverse Geocode Coordinates
// ==============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng } = body

    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid coordinates',
          message: 'Both latitude and longitude are required.',
        },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid coordinates',
          message: 'Coordinates are out of valid range.',
        },
        { status: 400 }
      )
    }

    try {
      // Call Nominatim reverse geocoding API from server side
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ProjectManagementApp/1.0 (Contact: dev@yourcompany.com)',
            'Accept': 'application/json',
          },
        }
      )

      if (!nominatimResponse.ok) {
        console.error('Nominatim API error:', nominatimResponse.status, nominatimResponse.statusText)
        return NextResponse.json(
          {
            success: false,
            error: 'Geocoding service error',
            message: 'Unable to reverse geocode the coordinates.',
          },
          { status: 502 }
        )
      }

      const data = await nominatimResponse.json()

      // Check if we got valid data
      if (!data || data.error) {
        return NextResponse.json(
          {
            success: false,
            error: 'No location found',
            message: 'No address found for the provided coordinates.',
          },
          { status: 404 }
        )
      }

      // Transform Nominatim response to our format
      const location = {
        place_id: `nominatim_${data.place_id || Date.now()}`,
        address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: getDisplayName(data),
        coordinates: {
          lat: parseFloat(data.lat) || lat,
          lng: parseFloat(data.lon) || lng,
        },
        // Additional details for reference
        details: {
          country: data.address?.country,
          state: data.address?.state,
          city: data.address?.city || data.address?.town || data.address?.village,
          postcode: data.address?.postcode,
          road: data.address?.road,
          house_number: data.address?.house_number,
        }
      }

      return NextResponse.json(
        {
          success: true,
          location,
          message: 'Location reverse geocoded successfully',
        },
        { status: 200 }
      )

    } catch (fetchError) {
      console.error('Error calling Nominatim reverse geocoding API:', fetchError)
      
      // Return fallback location with coordinates only
      return NextResponse.json(
        {
          success: true,
          location: {
            place_id: `manual_${Date.now()}`,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            displayName: 'Selected Location',
            coordinates: { lat, lng },
            details: {}
          },
          message: 'Location selected (geocoding unavailable)',
          warning: 'Address lookup failed, using coordinates only',
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Error in reverse geocoding route:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while reverse geocoding.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function getDisplayName(data: any): string {
  // Priority order for display name
  const candidates = [
    data.address?.house_number && data.address?.road ? 
      `${data.address.house_number} ${data.address.road}` : null,
    data.address?.road,
    data.address?.neighbourhood,
    data.address?.suburb,
    data.address?.city || data.address?.town || data.address?.village,
    data.name,
    data.display_name?.split(',')[0],
  ]

  // Return first non-empty candidate
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim()
    }
  }

  // Fallback to coordinates
  return `${parseFloat(data.lat).toFixed(4)}, ${parseFloat(data.lon).toFixed(4)}`
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
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