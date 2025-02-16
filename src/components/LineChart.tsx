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

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  historicalData: {
    timestamp: string;
    temperature: number;
    humidity: number;
  }[];
}

const LineChart: React.FC<ChartComponentProps> = ({ historicalData }) => {
  if (!historicalData.length) {
    return <p>No historical data available</p>;
  }

  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = {
    labels: sortedData.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Temperature (°C)",
        data: sortedData.map((d) => d.temperature),
        borderColor: "red",
        fill: false,
      },
      {
        label: "Humidity (%)",
        data: sortedData.map((d) => d.humidity),
        borderColor: "blue",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/5 rounded-xl shadow-md p-5 mt-5">
      <div className="h-[400px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default LineChart;
