import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import mqtt from "mqtt";
import "./index.css";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

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
    // For some reason cannot use .env for Username and Password
    const client = mqtt.connect("host", {
      username: "username",
      password: "password",
      protocolVersion: 5,
    });    

    client.on("connect", () => {
      console.log("Connected to MQTT");
      setMqttConnected(true);
      client.subscribe(MQTT_TOPIC);
    });

    client.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const newData = JSON.parse(message.toString());
          setRealTimeData(newData);
          setLastUpdate(new Date().toLocaleTimeString());

          fetch(`http://localhost:8080/api/sensor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newData),
          })
            .then((res) => res.json())
            .then((savedData) => {
              console.log("Data stored:", savedData);
              setHistoricalData((prevData) => [...prevData, savedData]);
            })
            .catch((err) => console.error("Error storing data:", err));
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
      console.log("Disconnecting from MQTT...");
      client.end();
    };
  }, []);

  const sortedHistoricalData = [...historicalData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = {
    labels: sortedHistoricalData.map((d) =>
      new Date(d.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: "Temperature (°C)",
        data: sortedHistoricalData.map((d) => d.temperature),
        borderColor: "red",
        fill: false,
      },
      {
        label: "Humidity (%)",
        data: sortedHistoricalData.map((d) => d.humidity),
        borderColor: "blue",
        fill: false,
      },
    ],
  };

  return (
    <div className="container">
      <h2>Dashboard</h2>
      
      <div className="real-time-container">
        <h3>Real-Time Data</h3>
        {realTimeData ? (
          <div className="real-time-values">
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
        <p className="mqtt-status">
          MQTT Status: {mqttConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
      </div>

      <div className="fetch-data-container">
        <label>Select Date: </label>
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
        <button className="update-btn" onClick={fetchData} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch Data"}
        </button>
      </div>
      <div className="chart-container">
        {historicalData.length > 0 ? (
          <Line data={chartData} />
        ) : (
          <p>No historical data available</p>
        )}
      </div>
      {historicalData.length > 0 && (
        <div className="stats-container">
          <h3>Daily Summary</h3>
          <div className="stats-content">
            <div className="stats-column">
              <h4>🌡️ Temperature</h4>
              <p>
                Highest:{" "}
                <strong>
                  {Math.max(...historicalData.map((d) => d.temperature))}°C
                </strong>
              </p>
              <p>
                Lowest:{" "}
                <strong>
                  {Math.min(...historicalData.map((d) => d.temperature))}°C
                </strong>
              </p>
              <p>
                Average:{" "}
                <strong>
                  {(
                    historicalData.reduce((sum, d) => sum + d.temperature, 0) /
                    historicalData.length
                  ).toFixed(2)}
                  °C
                </strong>
              </p>
            </div>

            <div className="stats-column">
              <h4>💧 Humidity</h4>
              <p>
                Highest:{" "}
                <strong>
                  {Math.max(...historicalData.map((d) => d.humidity))}%
                </strong>
              </p>
              <p>
                Lowest:{" "}
                <strong>
                  {Math.min(...historicalData.map((d) => d.humidity))}%
                </strong>
              </p>
              <p>
                Average:{" "}
                <strong>
                  {(
                    historicalData.reduce((sum, d) => sum + d.humidity, 0) /
                    historicalData.length
                  ).toFixed(2)}
                  %
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
