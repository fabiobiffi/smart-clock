export type WeatherIconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'unknown'

interface WeatherDescriptor {
  label: string
  icon: WeatherIconName
}

/** Codici WMO usati da Open-Meteo → description (in English) and icon. */
export function describeWeather(code: number, isDay: boolean): WeatherDescriptor {
  const clear: WeatherIconName = isDay ? 'clear-day' : 'clear-night'
  const partly: WeatherIconName = isDay ? 'partly-day' : 'partly-night'
  switch (code) {
    case 0: return { label: 'Clear', icon: clear }
    case 1: return { label: 'Mostly clear', icon: clear }
    case 2: return { label: 'Partly cloudy', icon: partly }
    case 3: return { label: 'Overcast', icon: 'cloudy' }
    case 45:
    case 48: return { label: 'Fog', icon: 'fog' }
    case 51:
    case 53:
    case 55: return { label: 'Drizzle', icon: 'drizzle' }
    case 56:
    case 57: return { label: 'Freezing drizzle', icon: 'drizzle' }
    case 61: return { label: 'Light rain', icon: 'rain' }
    case 63: return { label: 'Rain', icon: 'rain' }
    case 65: return { label: 'Heavy rain', icon: 'rain' }
    case 66:
    case 67: return { label: 'Freezing rain', icon: 'rain' }
    case 71: return { label: 'Light snow', icon: 'snow' }
    case 73: return { label: 'Snow', icon: 'snow' }
    case 75: return { label: 'Heavy snow', icon: 'snow' }
    case 77: return { label: 'Snow grains', icon: 'snow' }
    case 80:
    case 81: return { label: 'Showers', icon: 'rain' }
    case 82: return { label: 'Violent showers', icon: 'rain' }
    case 85:
    case 86: return { label: 'Snow showers', icon: 'snow' }
    case 95: return { label: 'Thunderstorm', icon: 'thunder' }
    case 96:
    case 99: return { label: 'Thunderstorm with hail', icon: 'thunder' }
    default: return { label: 'Conditions unavailable', icon: 'unknown' }
  }
}
