import {useEffect, useState} from "react";
import {ClipLoader} from "react-spinners";
import mqtt from "mqtt";
import LineChart from "./components/LineChart";
import "./index.css";

// Define the MQTT topic to subscribe to for sensor data
const MQTT_TOPIC = "sensor/data";

const App = () => {
  // State to store the most recent temperature and humidity readings received from MQTT
  const [realTimeData, setRealTimeData] = useState<{
    temperature: number;
    humidity: number;
  } | null>(null);

  // State to store historical sensor data fetched from the API
  const [historicalData, setHistoricalData] = useState<
    { timestamp: string; temperature: number; humidity: number }[]
  >([]);

  // State to manage the loading state when fetching historical data
  const [isLoading, setIsLoading] = useState(false);

  // State to track the connection status of the MQTT client
  const [mqttConnected, setMqttConnected] = useState(false);

  // State to store the selected date for fetching historical data
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State to store the last update time for real-time data
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Function to fetch historical data from the API based on the selected date
  const fetchData = () => {
    setIsLoading(true);

    // Format the selected date to match the API's expected format (dd_mm_yy)
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = selectedDate.getFullYear().toString().slice(-2);

    const formattedDate = `${day}_${month}_${year}`;
    // Construct the API URL with the formatted date
    const API_URL = `http://localhost:8080/api/sensor/${formattedDate}`;

    // Fetch data from the API
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        // Update the historicalData state with the fetched data
        setHistoricalData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });
  };

  // useEffect hook to manage the MQTT connection and message handling
  useEffect(() => {
    // Create an MQTT client and connect to the MQTT broker using environment variables
    const client = mqtt.connect(import.meta.env.VITE_MQTT_HOST, {
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
      protocolVersion: 5,
    });

    // Event listener for successful MQTT connection
    client.on("connect", () => {
      console.log("Connected to MQTT");
      setMqttConnected(true);
      // Subscribe to the specified MQTT topic
      client.subscribe(MQTT_TOPIC);
    });

    // Event listener for receiving messages from the subscribed topic
    client.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC) {
        const rawMessage = message.toString();

        try {
          // Parse the received message as JSON
          const newData = JSON.parse(rawMessage);
          // Update the realTimeData state with the parsed data
          setRealTimeData(newData);
          // Update the last update time with the current time
          setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
          console.error("Error parsing MQTT message:", error);
        }
      }
    });

    // Event listener for MQTT connection errors
    client.on("error", (err) => {
      console.error("MQTT Connection Error:", err);
      setMqttConnected(false);
    });

    // Cleanup function to disconnect the MQTT client when the component unmounts
    return () => {
      client.end();
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    // Main container for the app
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-[#e0e0e0] font-inter p-6">
      {/* Main card container */}
      <div className="max-w-4xl w-full bg-white/5 backdrop-blur-md rounded-2xl shadow-md p-8 text-center">
        {/* Dashboard title */}
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

        {/* Real-time data section */}
        <div className="bg-white/5 backdrop-blur-md shadow-md p-6 rounded-xl mb-6 w-full">
          {/* Real-time data title */}
          <h3 className="text-xl font-bold pb-5">Real-Time Data</h3>
          {/* Display real-time data or a message if no data has been received */}
          {realTimeData ? (
            <div className="text-lg font-small space-y-2">
              <p>
                🌡️ Temperature:{" "}
                <strong>{(realTimeData.temperature / 10).toFixed(1)}°C</strong>
              </p>
              <p>
                💧 Humidity:{" "}
                <strong>{(realTimeData.humidity / 10).toFixed(1)}%</strong>
              </p>
              <p>
                🕒 Last Updated: <strong>{lastUpdate}</strong>
              </p>
            </div>
          ) : (
            <p>No real-time data received yet...</p>
          )}
          {/* Display MQTT connection status */}
          <p className="font-bold mt-5 text-yellow-400">
            MQTT Status: {mqttConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </p>
        </div>

        {/* Historical data controls (date picker and fetch button) */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <label className="text-lg">Select Date:</label>
          <input
            type="date"
            className="bg-white/10 border-none py-3 px-5 rounded-md text-white text-lg outline-none focus:bg-white/20 h-14"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
          <button
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-5 rounded-md transition-all h-14"
            onClick={fetchData}
            disabled={isLoading}
          >
            {/* Display loading indicator or "Fetch Data" text */}
            {isLoading ? (
              <>
                Loading <ClipLoader size={15}/>
              </>
            ) : (
              "Fetch Data"
            )}
          </button>
        </div>

        {/* Historical data chart section */}
        <div className="w-full max-w-2xl mx-auto bg-white/5 rounded-xl shadow-md p-6 mt-6">
          {/* Display the LineChart component if historical data is available, otherwise show a message */}
          {historicalData.length > 0 ? (
            <LineChart historicalData={historicalData}/>
          ) : (
            <p>No historical data available</p>
          )}
        </div>

        {/* Daily summary section (only displayed if there's historical data) */}
        {historicalData.length > 0 && (
          <div className="w-full max-w-2xl mx-auto bg-white/5 rounded-xl shadow-md p-6 mt-6 text-center">
            <h3 className="text-xl font-semibold pb-4">Daily Summary</h3>
            <div className="flex justify-between gap-6 text-center">
              {/* Temperature summary */}
              <div className="flex-1 bg-white/10 p-5 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold pb-3">🌡️ Temperature</h4>
                <p>
                  Highest:{" "}
                  <strong>
                    {Math.max(
                      ...historicalData.map((d) => d.temperature)
                    ).toFixed(1)}
                    °C
                  </strong>
                </p>
                <p>
                  Lowest:{" "}
                  <strong>
                    {Math.min(
                      ...historicalData.map((d) => d.temperature)
                    ).toFixed(1)}
                    °C
                  </strong>
                </p>
                <p>
                  Average:{" "}
                  <strong>
                    {(
                      historicalData.reduce(
                        (sum, d) => sum + d.temperature,
                        0
                      ) / historicalData.length
                    ).toFixed(1)}
                    °C
                  </strong>
                </p>
              </div>
              {/* Humidity summary */}
              <div className="flex-1 bg-white/10 p-5 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold pb-3">💧 Humidity</h4>
                <p>
                  Highest:{" "}
                  <strong>
                    {Math.max(...historicalData.map((d) => d.humidity)).toFixed(
                      2
                    )}
                    %
                  </strong>
                </p>
                <p>
                  Lowest:{" "}
                  <strong>
                    {Math.min(...historicalData.map((d) => d.humidity)).toFixed(
                      2
                    )}
                    %
                  </strong>
                </p>
                <p>
                  Average:{" "}
                  <strong>
                    {(
                      historicalData.reduce((sum, d) => sum + d.humidity, 0) /
                      historicalData.length
                    ).toFixed(1)}
                    %
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
