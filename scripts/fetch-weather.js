const axios = require('axios');
const admin = require('firebase-admin');

// This is a service account key that we will get from Firebase
// It allows our script to securely access our database
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const weatherApiKey = process.env.WEATHER_API_KEY;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const location = "Hyderabad";
const url = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=no`;

async function fetchAndSaveWeather() {
  try {
    console.log("Fetching weather data...");
    const response = await axios.get(url);
    const weatherData = response.data;

    const dataToSave = {
      location: weatherData.location.name,
      temp_c: weatherData.current.temp_c,
      condition: weatherData.current.condition.text,
      precip_mm: weatherData.current.precip_mm,
      last_updated: weatherData.current.last_updated,
    };

    await db.collection("weather_reports").doc(location).set(dataToSave);
    console.log("Successfully fetched and saved weather data for", location);
  } catch (error) {
    console.error("Error fetching weather data:", error.response ? error.response.data : error.message);
    process.exit(1); // Exit with an error code
  }
}

fetchAndSaveWeather();