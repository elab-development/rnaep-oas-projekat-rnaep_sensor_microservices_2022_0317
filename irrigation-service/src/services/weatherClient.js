const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Dohvata trenutne vremenske podatke za zadate koordinate
 * @param {number} lat - Geografska širina
 * @param {number} lon - Geografska dužina
 * @param {string} city - Naziv grada (opciono, za prikaz)
 * @returns {Promise<Object>} - Vremenski podaci
 */
async function getWeatherForecast(lat, lon, city = 'Belgrade') {
  try {
    console.log(`🌤️ WEATHER: Dohvatam prognozu za ${city} (${lat}, ${lon})`);

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await axios.get(url, {
      timeout: 5000 // 5 sekundi timeout
    });

    const data = response.data;

    // Proveri da li ima podataka o kiši
    const willRain = data.weather.some(w => 
      w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm'
    );

    const forecast = {
      temperature: Math.round(data.main.temp * 10) / 10,
      feels_like: Math.round(data.main.feels_like * 10) / 10,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      weather: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      willRain: willRain,
      city: data.name || city,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ WEATHER: Uspešno dohvaćeno vreme za ${forecast.city}`);
    console.log(`   🌡️ Temperatura: ${forecast.temperature}°C`);
    console.log(`   💨 Vlažnost: ${forecast.humidity}%`);
    console.log(`   ☁️ ${forecast.weather}`);
    console.log(`   🌧️ Kiša: ${forecast.willRain ? 'Da' : 'Ne'}`);

    return forecast;

  } catch (error) {
    console.error('❌ WEATHER: Greška pri dohvatanju prognoze:', error.message);
    
    // Ako API ne radi, vrati default vrednosti
    return {
      temperature: 20,
      feels_like: 20,
      humidity: 60,
      pressure: 1013,
      weather: 'nepoznato',
      icon: '01d',
      wind_speed: 0,
      willRain: false,
      city: city || 'Belgrade',
      timestamp: new Date().toISOString(),
      _error: true,
      _message: 'Korišćene default vrednosti (API nedostupan)'
    };
  }
}

/**
 * Dohvata višednevnu vremensku prognozu sa Open-Meteo API-ja
 * @param {number} lat - Geografska širina
 * @param {number} lon - Geografska dužina
 * @param {string} city - Naziv grada (opciono, za prikaz)
 * @returns {Promise<Object>} - Prognoza za narednih 7 dana
 */
async function getWeatherForecast7Days(lat, lon, city = 'Belgrade') {
  try {
    console.log(`🌤️ WEATHER (7d): Dohvatam prognozu za ${city} (${lat}, ${lon})`);

    // Open-Meteo API URL
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;

    const response = await axios.get(url, {
      timeout: 10000 // 10 sekundi timeout
    });

    const data = response.data;

    // Proveri da li ima podataka
    if (!data.daily) {
      throw new Error('Nema podataka o prognozi');
    }

    // Formiraj prognozu za svaki dan
    const forecast = {
      city: city,
      lat: lat,
      lon: lon,
      days: data.daily.time.map((time, index) => ({
        date: time,
        temperature_max: Math.round(data.daily.temperature_2m_max[index]),
        temperature_min: Math.round(data.daily.temperature_2m_min[index]),
        precipitation: Math.round(data.daily.precipitation_sum[index] * 10) / 10,
        weather_code: data.daily.weathercode[index],
        weather_description: getWeatherDescription(data.daily.weathercode[index]),
        weather_icon: getWeatherIcon(data.daily.weathercode[index])
      })),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ WEATHER (7d): Uspešno dohvaćena prognoza za ${city}`);
    console.log(`   📅 ${forecast.days.length} dana prognoze`);

    return forecast;

  } catch (error) {
    console.error('❌ WEATHER (7d): Greška pri dohvatanju prognoze:', error.message);
    
    // Ako API ne radi, vrati default vrednosti
    return {
      city: city || 'Belgrade',
      lat: lat,
      lon: lon,
      days: generateDummyForecast(),
      timestamp: new Date().toISOString(),
      _error: true,
      _message: 'Korišćene default vrednosti (API nedostupan)'
    };
  }
}

/**
 * Generiše dummy prognozu za 7 dana (kada API ne radi)
 */
function generateDummyForecast() {
  const today = new Date();
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Random vrednosti
    const tempMax = Math.round(20 + Math.random() * 15);
    const tempMin = Math.round(10 + Math.random() * 10);
    const precip = Math.round(Math.random() * 20 * 10) / 10;
    const weatherCode = [0, 1, 2, 3, 45, 48, 51, 61, 80][Math.floor(Math.random() * 9)];
    
    days.push({
      date: date.toISOString().split('T')[0],
      temperature_max: tempMax,
      temperature_min: tempMin,
      precipitation: precip,
      weather_code: weatherCode,
      weather_description: getWeatherDescription(weatherCode),
      weather_icon: getWeatherIcon(weatherCode)
    });
  }
  
  return days;
}

/**
 * Konvertuje WMO kod u opis vremena
 */
function getWeatherDescription(code) {
  const codes = {
    0: 'Sunčano',
    1: 'Uglavnom sunčano',
    2: 'Delimično oblačno',
    3: 'Oblačno',
    45: 'Magla',
    48: 'Magla sa inje',
    51: 'Slaba kiša',
    53: 'Umerena kiša',
    55: 'Jaka kiša',
    61: 'Slaba kiša',
    63: 'Umerena kiša',
    65: 'Jaka kiša',
    80: 'Pljusak',
    81: 'Umeren pljusak',
    82: 'Jak pljusak',
    95: 'Oluja',
    96: 'Oluja sa gradom'
  };
  return codes[code] || 'Nepoznato';
}

/**
 * Konvertuje WMO kod u ikonu
 */
function getWeatherIcon(code) {
  if ([0, 1].includes(code)) return '☀️';
  if ([2].includes(code)) return '⛅';
  if ([3].includes(code)) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  if ([95, 96].includes(code)) return '⛈️';
  return '🌤️';
}

module.exports = {
  getWeatherForecast,
  getWeatherForecast7Days
};