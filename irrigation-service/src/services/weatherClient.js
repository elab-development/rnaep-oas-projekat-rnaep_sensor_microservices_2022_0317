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

module.exports = {
  getWeatherForecast
};