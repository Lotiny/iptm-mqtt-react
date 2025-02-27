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

// Register necessary Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// Define props interface for the component
interface ChartComponentProps {
  historicalData: {
    timestamp: string;
    temperature: number;
    humidity: number;
  }[];
}

const LineChart: React.FC<ChartComponentProps> = ({ historicalData }) => {
  // Display a message if no historical data is available
  if (!historicalData.length) {
    return <p>No historical data available</p>;
  }

  // Sort data by timestamp to ensure correct order in the chart
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Prepare data for the chart
  const chartData = {
    labels: sortedData.map((d) => new Date(d.timestamp).toLocaleTimeString()), // Convert timestamps to readable time
    datasets: [
      {
        label: "Temperature (°C)",
        data: sortedData.map((d) => d.temperature), // Temperature values
        borderColor: "red", // Line color
        fill: false, // No fill under the line
      },
      {
        label: "Humidity (%)",
        data: sortedData.map((d) => d.humidity), // Humidity values
        borderColor: "blue", // Line color
        fill: false, // No fill under the line
      },
    ],
  };

  // Chart display options
  const chartOptions = {
    responsive: true, // Makes the chart responsive
    maintainAspectRatio: false, // Allows flexibility in chart sizing
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/5 rounded-xl shadow-md p-5 mt-5">
      <div className="h-[400px] w-full">
        {/* Render the Line chart with data and options */}
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default LineChart;
