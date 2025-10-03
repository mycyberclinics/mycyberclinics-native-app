import axios from 'axios';

const API_BASE_URL = 'http://server:4000/api'; // adjust as needed

export const fetchDashboardData = async () => {
  const response = await axios.get(`${API_BASE_URL}/dashboard`);
  return response.data;
};