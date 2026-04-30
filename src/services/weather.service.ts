import axios from "axios";

interface WeatherData {
  [key: string]: number | string | null;
  temperature: number | null;
  windspeed: number | null;
  weathercode: number | null;
  time: string | null;
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude,
        longitude,
        current_weather: true,
      },
      timeout: 5000,
    });

    const cw = data?.current_weather;
    if (!cw) return null;

    return {
      temperature: cw.temperature ?? null,
      windspeed: cw.windspeed ?? null,
      weathercode: cw.weathercode ?? null,
      time: cw.time ?? null,
    };
  } catch {
    return null;
  }
}
