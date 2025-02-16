import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import mqtt from "mqtt";
import LineChart from "./components/LineChart";
import "./index.css";

const MQTT_TOPIC = "sensor/data";

const App = () => {
  const [realTimeData, setRealTimeData] = useState<{
    temperature: number;
    humidity: number;
  } | null>(null);
  const [historicalData, setHistoricalData] = useState<
    { timestamp: string; temperature: number; humidity: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchData = () => {
    setIsLoading(true);

    const day = selectedDate.getDate().toString().padStart(2, "0");
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = selectedDate.getFullYear().toString().slice(-2);

    const formattedDate = `${day}_${month}_${year}`;
    const API_URL = `http://localhost:8080/api/sensor/${formattedDate}`;

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setHistoricalData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const client = mqtt.connect(
      import.meta.env.VITE_MQTT_HOST,
      {
        username: import.meta.env.VITE_MQTT_USERNAME,
        password: import.meta.env.VITE_MQTT_PASSWORD,
        protocolVersion: 5,
      }
    );

    client.on("connect", () => {
      console.log("Connected to MQTT");
      setMqttConnected(true);
      client.subscribe(MQTT_TOPIC);
    });

    client.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC) {
        const rawMessage = message.toString();

        try {
          const newData = JSON.parse(rawMessage);
          setRealTimeData(newData);
          setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
          console.error("Error parsing MQTT message:", error);
        }
      }
    });    

    client.on("error", (err) => {
      console.error("MQTT Connection Error:", err);
      setMqttConnected(false);
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-[#e0e0e0] font-inter p-6">
      <div className="max-w-4xl w-full bg-white/5 backdrop-blur-md rounded-2xl shadow-md p-8 text-center">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

        <div className="bg-white/5 backdrop-blur-md shadow-md p-6 rounded-xl mb-6 w-full">
          <h3 className="text-xl font-bold pb-5">Real-Time Data</h3>
          {realTimeData ? (
            <div className="text-lg font-small space-y-2">
              <p>
                🌡️ Temperature: <strong>{realTimeData.temperature}°C</strong>
              </p>
              <p>
                💧 Humidity: <strong>{realTimeData.humidity}%</strong>
              </p>
              <p>
                🕒 Last Updated: <strong>{lastUpdate}</strong>
              </p>
            </div>
          ) : (
            <p>No real-time data received yet...</p>
          )}
          <p className="font-bold mt-5 text-yellow-400">
            MQTT Status: {mqttConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </p>
        </div>

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
            {isLoading ? (
              <>
                Loading <ClipLoader size={15} />
              </>
            ) : (
              "Fetch Data"
            )}
          </button>
        </div>

        <div className="w-full max-w-2xl mx-auto bg-white/5 rounded-xl shadow-md p-6 mt-6">
          {historicalData.length > 0 ? (
            <LineChart historicalData={historicalData} />
          ) : (
            <p>No historical data available</p>
          )}
        </div>

        {historicalData.length > 0 && (
          <div className="w-full max-w-2xl mx-auto bg-white/5 rounded-xl shadow-md p-6 mt-6 text-center">
            <h3 className="text-xl font-semibold pb-4">Daily Summary</h3>
            <div className="flex justify-between gap-6 text-center">
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
